#!/usr/bin/env bash
# ==============================================================================
# Skrip Pengerasan Virtual Machine (VM Hardening) — AegisMed AI (sec-0.2)
# Memenuhi Kriteria:
# - Login SSH hanya dengan kunci kriptografis (PubkeyAuthentication yes, PasswordAuthentication no)
# - Root login ditolak (PermitRootLogin no)
# - Indeks Keamanan Lynis minimal 70 (Target indeks: >= 80)
#
# Pemetaan Risiko Tugas 1:
# - R03: Pengambilalihan Akun & Server (Account / Host Takeover)
# - R04: Serangan Denial of Service (DoS via SSH flood)
# - T01: Host Spoofing & Credential Guessing
# - T06: Elevation of Privilege ke Akun Root
# - T09: Auth Brute-Force pada Port SSH (Port 22)
# - T10: Repudiation (Audit Logging dengan auditd)
# ==============================================================================

set -euo pipefail

echo "[+] Memulai Pengerasan VM AegisMed AI (sec-0.2)..."

# 1. Pastikan script dijalankan sebagai root/sudo
if [[ $EUID -ne 0 ]]; then
   echo "[-] Skrip ini harus dijalankan dengan hak akses root (sudo)." 
   exit 1
fi

# 2. Pengerasan Layanan SSH (/etc/ssh/sshd_config.d/99-hardened.conf)
echo "[+] Menerapkan konfigurasi SSH Hardening..."
cat << 'EOF' > /etc/ssh/sshd_config.d/99-hardened.conf
# AegisMed AI — Hardened SSH Configuration (sec-0.2)
# Mitigasi R03, T01, T06, T09

# 1. Larang Login Root Langsung
PermitRootLogin no

# 2. Nonaktifkan Autentikasi Kata Sandi (Wajib SSH Key)
PasswordAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no

# 3. Batasi Jumlah Percobaan Login dan Sesi Idle
MaxAuthTries 3
MaxSessions 2
ClientAliveInterval 300
ClientAliveCountMax 2

# 4. Nonaktifkan Fitur yang Tidak Diperlukan
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
GatewayPorts no
PermitUserEnvironment no

# 5. Protokol dan Kriptografi Ketat
Protocol 2
LogLevel VERBOSE
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com
EOF

chmod 600 /etc/ssh/sshd_config.d/99-hardened.conf
systemctl reload sshd || systemctl reload ssh || true
echo "[+] Layanan SSH berhasil diperkeras (Key-only, No root login)."

# 3. Pengerasan Parameter Kernel Sysctl (/etc/sysctl.d/99-hardened.conf)
echo "[+] Menerapkan parameter kernel sysctl..."
cat << 'EOF' > /etc/sysctl.d/99-hardened.conf
# Perlindungan IP Spoofing dan Redirection (R04, T02)
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Perlindungan ICMP Flood dan Broadcast DoS (R04)
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.tcp_syncookies = 1

# Nonaktifkan Source Routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Perlindungan Memori dan Anti-Exploit Kernel (T06)
kernel.randomize_va_space = 2
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
fs.protected_fifos = 2
fs.protected_regular = 2
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
kernel.yama.ptrace_scope = 2
EOF

sysctl -p /etc/sysctl.d/99-hardened.conf || true

# 4. Pengerasan Izin Berkas dan Umask
echo "[+] Mengamankan izin berkas sistem dan umask..."
chmod 600 /etc/shadow || true
chmod 600 /etc/gshadow || true
chmod 644 /etc/passwd || true
chmod 644 /etc/group || true

# Tetapkan umask default 027 (mencegah read/write oleh other)
sed -i -E 's/UMASK\s+[0-9]+/UMASK 027/' /etc/login.defs || true

# 5. Konfigurasi Firewall UFW
echo "[+] Mengonfigurasi firewall host (UFW)..."
if command -v ufw >/dev/null 2>&1; then
    ufw --force reset || true
    ufw default deny incoming
    ufw default allow outgoing
    # Izinkan port SSH (hanya via key)
    ufw allow 22/tcp comment 'SSH Key-only access'
    # Izinkan HTTP/HTTPS untuk reverse proxy publik jika diperlukan
    ufw allow 80/tcp comment 'HTTP reverse proxy'
    ufw allow 443/tcp comment 'HTTPS reverse proxy'
    ufw --force enable
    echo "[+] UFW aktif: Port DB internal (5432) dan port dev (3000) ditolak dari luar."
fi

# 6. Pemasangan & Pengaktifan Auditd (Mitigasi T10 - Anti-Repudiation)
if command -v systemctl >/dev/null 2>&1; then
    systemctl enable auditd || true
    systemctl start auditd || true
fi

echo "[+] Pengerasan VM selesai! Sistem siap dipindai dengan Lynis."
