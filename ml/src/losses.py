import torch
import torch.nn as nn
import torch.nn.functional as F

class DiceLoss(nn.Module):
    def __init__(self, smooth=1.0):
        super().__init__()
        self.smooth = smooth

    def forward(self, logits, targets):
        probs = torch.sigmoid(logits)
        probs = probs.view(-1)
        targets = targets.view(-1)
        intersection = (probs * targets).sum()
        dice = (2.0 * intersection + self.smooth) / (probs.sum() + targets.sum() + self.smooth)
        return 1.0 - dice

class MultiClassDiceFocalLoss(nn.Module):
    def __init__(self, num_classes=4, alpha=None, gamma=2.0, smooth=1.0):
        super().__init__()
        self.num_classes = num_classes
        self.gamma = gamma
        self.smooth = smooth
        self.alpha = alpha if alpha is not None else [0.2, 0.5, 1.0, 2.0] # Penalty weights for severe damage

    def forward(self, logits, targets):
        """
        logits: [B, C, H, W]
        targets: [B, H, W] with class indices 0..C-1
        """
        log_probs = F.log_softmax(logits, dim=1)
        probs = torch.exp(log_probs)

        # 1. Focal loss
        ce_loss = F.nll_loss(log_probs, targets, reduction='none')
        pt = torch.gather(probs, 1, targets.unsqueeze(1)).squeeze(1)
        focal_loss = ((1.0 - pt) ** self.gamma) * ce_loss
        focal_loss = focal_loss.mean()

        # 2. Multi-class Dice loss
        dice_total = 0.0
        one_hot = F.one_hot(targets, self.num_classes).permute(0, 3, 1, 2).float()
        for c in range(self.num_classes):
            p = probs[:, c, :, :].contiguous().view(-1)
            t = one_hot[:, c, :, :].contiguous().view(-1)
            inter = (p * t).sum()
            dice_c = (2.0 * inter + self.smooth) / (p.sum() + t.sum() + self.smooth)
            dice_total += (1.0 - dice_c)

        dice_loss = dice_total / self.num_classes
        return focal_loss + dice_loss

def compute_metrics(pred_mask, true_mask, num_classes=2):
    """
    Computes per-class IoU, F1 score, precision, recall, and overall accuracy.
    pred_mask: [N] binary or multi-class tensor
    true_mask: [N] binary or multi-class tensor
    """
    metrics = {}
    ious = []
    f1s = []

    for c in range(num_classes):
        p = (pred_mask == c)
        t = (true_mask == c)
        tp = (p & t).sum().item()
        fp = (p & ~t).sum().item()
        fn = (~p & t).sum().item()

        iou = tp / (tp + fp + fn + 1e-7)
        prec = tp / (tp + fp + 1e-7)
        rec = tp / (tp + fn + 1e-7)
        f1 = 2 * (prec * rec) / (prec + rec + 1e-7)

        ious.append(iou)
        f1s.append(f1)
        metrics[f"class_{c}_iou"] = round(iou * 100, 2)
        metrics[f"class_{c}_f1"] = round(f1 * 100, 2)
        metrics[f"class_{c}_precision"] = round(prec * 100, 2)
        metrics[f"class_{c}_recall"] = round(rec * 100, 2)

    metrics["mean_iou"] = round(sum(ious) / len(ious) * 100, 2)
    metrics["mean_f1"] = round(sum(f1s) / len(f1s) * 100, 2)
    overall_acc = (pred_mask == true_mask).float().mean().item()
    metrics["overall_accuracy"] = round(overall_acc * 100, 2)

    return metrics
