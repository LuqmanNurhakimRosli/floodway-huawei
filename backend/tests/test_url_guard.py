import pytest

from app.vision.url_guard import UnsafeURL, validate_source_url


@pytest.mark.parametrize("url", [
    "http://127.0.0.1/frame.jpg", "http://localhost/frame.jpg", "http://10.0.0.5/cam",
    "http://192.168.1.20:8080/snap.jpg", "http://169.254.169.254/latest/meta-data",
    "http://[::1]/x", "rtsp://172.16.0.9/stream",
])
def test_blocks_private_and_loopback(url):
    with pytest.raises(UnsafeURL):
        validate_source_url(url)


@pytest.mark.parametrize("url", ["file:///etc/passwd", "ftp://example.com/x", "gopher://example.com"])
def test_blocks_bad_schemes(url):
    with pytest.raises(UnsafeURL):
        validate_source_url(url)


def test_blocks_credentials_in_url():
    with pytest.raises(UnsafeURL):
        validate_source_url("https://user:pw@93.184.216.34/cam.jpg")


def test_allows_public_ip():
    assert validate_source_url("https://93.184.216.34/cam.jpg").startswith("https://")


def test_private_allowed_only_when_flag_set():
    assert validate_source_url("http://192.168.1.20/snap.jpg", allow_private=True)
