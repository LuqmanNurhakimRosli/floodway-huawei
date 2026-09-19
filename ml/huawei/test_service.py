import os
import sys
import json
import torch
from model import SiameseUNet

def run_model_inference():
    print("Packing ModelArts custom inference handler...")
    model = SiameseUNet(in_channels=6, n_damage_classes=4)
    # Dummy pass to verify interface
    t1 = torch.randn(1, 6, 256, 256)
    t2 = torch.randn(1, 6, 256, 256)
    out = model(t1, t2)
    print("Inference output verified. Flood logits:", out['flood'].shape, "| Damage logits:", out['damage'].shape)

if __name__ == "__main__":
    run_model_inference()
