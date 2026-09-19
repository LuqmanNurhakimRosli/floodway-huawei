import torch
import torch.nn as nn
import torch.nn.functional as F

class DoubleConv(nn.Module):
    """(convolution => [BN] => ReLU) * 2"""
    def __init__(self, in_channels, out_channels, mid_channels=None):
        super().__init__()
        if not mid_channels:
            mid_channels = out_channels
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, mid_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(mid_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(mid_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.double_conv(x)

class Down(nn.Module):
    """Downscaling with maxpool then double conv"""
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.maxpool_conv = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_channels, out_channels)
        )

    def forward(self, x):
        return self.maxpool_conv(x)

class Up(nn.Module):
    """Upscaling then double conv"""
    def __init__(self, in_channels, out_channels, bilinear=True):
        super().__init__()
        if bilinear:
            self.up = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
            self.conv = DoubleConv(in_channels, out_channels, in_channels // 2)
        else:
            self.up = nn.ConvTranspose2d(in_channels, in_channels // 2, kernel_size=2, stride=2)
            self.conv = DoubleConv(in_channels, out_channels)

    def forward(self, x1, x2):
        x1 = self.up(x1)
        # input is CHW
        diffY = x2.size()[2] - x1.size()[2]
        diffX = x2.size()[3] - x1.size()[3]
        x1 = F.pad(x1, [diffX // 2, diffX - diffX // 2,
                        diffY // 2, diffY - diffY // 2])
        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)

class SiameseUNet(nn.Module):
    """
    Bi-Temporal Siamese U-Net for Post-Disaster Change & Damage Segmentation
    Features:
    - Shared weights between T1 (Pre-event) and T2 (Post-event) encoder paths
    - Multi-scale feature difference & concatenation
    - Dual heads:
        1) Flood/Water Inundation binary map (sigmoid)
        2) 4-Class Damage Severity map (No damage, Minor, Major, Destroyed)
    """
    def __init__(self, in_channels=6, n_damage_classes=4, bilinear=True):
        super().__init__()
        self.in_channels = in_channels
        self.n_damage_classes = n_damage_classes
        self.bilinear = bilinear

        # Shared Encoder (Branch A for T1, Branch B for T2 with SHARED WEIGHTS)
        self.inc = DoubleConv(in_channels, 64)
        self.down1 = Down(64, 128)
        self.down2 = Down(128, 256)
        self.down3 = Down(256, 512)
        factor = 2 if bilinear else 1
        self.down4 = Down(512, 1024 // factor)

        # Fused Feature Decoder (receives abs-diff + cat of T1 and T2 encoder features)
        # Difference features (64, 128, 256, 512, 512)
        self.up1 = Up(1024, 512 // factor, bilinear)
        self.up2 = Up(512, 256 // factor, bilinear)
        self.up3 = Up(256, 128 // factor, bilinear)
        self.up4 = Up(128, 64, bilinear)

        # Output Heads
        # Head 1: Flood Inundation Mask (Binary: 0=No Water, 1=Water/Flood)
        self.outc_flood = nn.Conv2d(64, 1, kernel_size=1)

        # Head 2: Structural Damage Classification (4 classes: No Damage, Minor, Major, Destroyed)
        self.outc_damage = nn.Conv2d(64, n_damage_classes, kernel_size=1)

    def encode(self, x):
        """Single encoder branch pass"""
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)
        return x1, x2, x3, x4, x5

    def forward(self, t1, t2):
        """
        t1: Pre-event imagery [B, C, H, W]
        t2: Post-event imagery [B, C, H, W]
        Returns:
            dict with:
                'flood': [B, 1, H, W] logits
                'damage': [B, 4, H, W] logits
        """
        # 1. Siamese Feature Extraction (Shared weights)
        x1_t1, x2_t1, x3_t1, x4_t1, x5_t1 = self.encode(t1)
        x1_t2, x2_t2, x3_t2, x4_t2, x5_t2 = self.encode(t2)

        # 2. Bi-Temporal Multi-Scale Differencing & Fusing
        # Use absolute difference to capture disaster change signatures
        f5 = torch.abs(x5_t2 - x5_t1)
        f4 = torch.abs(x4_t2 - x4_t1)
        f3 = torch.abs(x3_t2 - x3_t1)
        f2 = torch.abs(x2_t2 - x2_t1)
        f1 = torch.abs(x1_t2 - x1_t1)

        # 3. U-Net Decoding
        x = self.up1(f5, f4)
        x = self.up2(x, f3)
        x = self.up3(x, f2)
        x = self.up4(x, f1)

        # 4. Predictions
        logits_flood = self.outc_flood(x)
        logits_damage = self.outc_damage(x)

        return {
            'flood': logits_flood,
            'damage': logits_damage
        }

if __name__ == "__main__":
    # Smoke test architecture
    model = SiameseUNet(in_channels=6, n_damage_classes=4)
    t1_dummy = torch.randn(2, 6, 256, 256)
    t2_dummy = torch.randn(2, 6, 256, 256)
    out = model(t1_dummy, t2_dummy)
    print("Model created successfully!")
    print("Output flood shape:", out['flood'].shape)
    print("Output damage shape:", out['damage'].shape)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Total parameters: {total_params:,}")
