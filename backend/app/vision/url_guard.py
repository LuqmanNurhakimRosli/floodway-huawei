"""SSRF guard. Users can type a camera URL and our server will fetch it, so we must refuse
loopback / private / link-local / reserved targets and unexpected schemes."""
from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

ALLOWED_SCHEMES = {"http", "https", "rtsp", "rtsps"}


class UnsafeURL(ValueError):
    pass


def _is_blocked(ip: ipaddress._BaseAddress) -> bool:
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def validate_source_url(url: str, allow_private: bool = False) -> str:
    parsed = urlparse(url.strip())
    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        raise UnsafeURL("only http, https, rtsp and rtsps URLs are allowed")
    if not parsed.hostname:
        raise UnsafeURL("URL has no host")
    if parsed.username or parsed.password:
        raise UnsafeURL("put credentials in the username/password fields, not in the URL")
    if allow_private:
        return url.strip()
    try:
        infos = socket.getaddrinfo(parsed.hostname, parsed.port or 80, proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise UnsafeURL(f"cannot resolve host: {parsed.hostname}") from exc
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if _is_blocked(ip):
            raise UnsafeURL("that address is on a private or reserved network")
    return url.strip()
