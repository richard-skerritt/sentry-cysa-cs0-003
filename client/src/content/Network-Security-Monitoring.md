# Network Security Monitoring

## Overview — CS0-003 Domain 1

**Network Security Monitoring (NSM)** is the collection, analysis, and escalation of network data to detect and respond to intrusions. Unlike perimeter controls, NSM assumes breach and focuses on visibility into what is moving across the wire. The three data types — full packet capture, flow data, and logs — provide complementary coverage.

## NSM Data Types

| Data Type | What It Contains | Storage Cost | Use Case |
|---|---|---|---|
| **Full Packet Capture (PCAP)** | Complete network traffic, including payload | Very high | Deep investigation, protocol analysis, IDS rule validation |
| **Flow data (NetFlow/IPFIX)** | 5-tuple + byte/packet counts, no payload | Low | Baseline, anomaly detection, lateral movement |
| **Network logs** | Parsed metadata from protocols (DNS, HTTP, TLS) | Medium | SOC alerting, SIEM correlation |
| **IDS/IPS alerts** | Signature matches with context | Low | Direct alerting on known patterns |

**Key trade-off:** Full packet capture provides maximum fidelity but is expensive to store at scale. Flow data provides behavioral patterns cheaply but cannot reconstruct payloads.

## Flow Data: NetFlow, sFlow, IPFIX

- **NetFlow** (Cisco) — exports unidirectional flow records; v5 (fixed fields), v9 (template-based), v10 = IPFIX
- **IPFIX** — IETF standard based on NetFlow v9; most modern platforms support it
- **sFlow** — packet sampling (1-in-N packets) rather than full flows; lower overhead, less precise

### Flow Record Fields

```
Src IP     | Dst IP     | Src Port | Dst Port | Proto | Bytes | Packets | Start | End | Flags
10.1.1.5   | 192.168.0.1| 54321    | 443      | TCP   | 4096  | 12      | ...   | ... | SYN,ACK
```

**Lateral movement detection with flow:** Look for internal-to-internal connections on admin ports (445, 3389, 5985) from hosts that don't normally communicate with each other.

## Zeek (formerly Bro)

**Zeek** is a passive network analysis framework that generates structured protocol logs from traffic. It does not alert by default — it produces logs that are fed into a SIEM or analyzed directly.

### Key Zeek Log Files

| Log File | Contents |
|---|---|
| `conn.log` | All TCP/UDP/ICMP connections — 5-tuple, duration, bytes |
| `dns.log` | DNS queries and responses — query, type, answer, TTL |
| `http.log` | HTTP requests — method, host, URI, user-agent, status, mime type |
| `ssl.log` | TLS handshake metadata — SNI, cert subject, version, cipher |
| `files.log` | File transfers — hash (MD5/SHA1), MIME type, size, extraction |
| `notice.log` | Zeek-generated alerts from built-in scripts |
| `weird.log` | Protocol anomalies — useful for detecting protocol abuse |

```
# Example: Zeek conn.log entry (TSV)
1711500000.123456  Cd3bFx1Qb...  10.0.0.5  54321  8.8.8.8  53  udp  dns  1  0.001  56  100  SF  -  -  0  D  1  84  1  112
```

## Suricata

**Suricata** is an open-source IDS/IPS/NSM engine. It supports PCAP inspection, inline prevention (IPS mode), and multi-threading. It uses **Emerging Threats** and **Snort-compatible** rule sets.

### Suricata Rule Anatomy

```
alert tcp $HOME_NET any -> $EXTERNAL_NET 443 (
  msg:"ET MALWARE CobaltStrike Beacon Checkin";
  flow:established,to_server;
  content:"|00 00 00 00 00|";
  depth:5;
  threshold:type both, track by_src, count 3, seconds 60;
  classtype:trojan-activity;
  sid:2019034;
  rev:4;
)
```

- **`action`** — alert, drop (IPS), pass, reject
- **`msg`** — human-readable description
- **`flow`** — connection state filter
- **`content`** — byte or string match
- **`threshold`** — rate limiting for noisy rules
- **`sid`** — unique signature ID

### Suricata Outputs

- `eve.json` — unified JSON log for all events; best for SIEM ingestion
- `fast.log` — one-line per alert; quick triage
- `stats.log` — performance metrics

## Snort

**Snort** is the original open-source IDS, now maintained by Cisco. Rule syntax is largely compatible with Suricata. Key differences:

- Snort is single-threaded (older versions); Suricata is multi-threaded
- Both use similar rule formats; Snort rules are widely distributed
- **Snort rule actions:** alert, log, pass, drop, reject, sdrop

```
# Snort rule example
alert tcp any any -> $HTTP_SERVERS 80 (
  msg:"WEB-ATTACKS PHP Remote File Include";
  flow:to_server,established;
  content:"http://";
  pcre:"/(\?|&)[^=]+=http:\/\//i";
  classtype:web-application-attack;
  sid:1000001;
  rev:1;
)
```

## Beaconing Detection

**Beaconing** is a malware behavior where the compromised host periodically contacts a C2 server at regular intervals to check for instructions. The regularity is the detection signal.

### Detection Methods

- **Statistical jitter analysis** — calculate variance in connection intervals to a destination; low variance = likely automated
- **Connection frequency + small payload** — beacon = many small, regular connections vs legitimate = bursty, variable
- **Off-hours connectivity** — connections to external IPs at 3 AM from a workstation
- **Long connection duration** — persistent connections for hours (C2 keep-alive)

```spl
# Splunk: detect low-variance periodic connections (beaconing)
index=netflow dest_ip!=RFC1918
| bucket _time span=10m
| stats count by dest_ip, src_ip, _time
| eventstats stdev(count) as jitter by dest_ip, src_ip
| where jitter < 2 AND count > 5
| table src_ip, dest_ip, jitter, count
```

## DNS Tunneling Detection

DNS tunneling encodes data in DNS queries/responses to exfiltrate data or establish C2 over a channel typically allowed through firewalls.

### Indicators

- **High-entropy subdomain names** — `aGVsbG8gd29ybGQ=.evil.com` (Base64 in subdomain)
- **Unusually long domain names** — DNS exfil often uses very long hostnames
- **High query volume to a single domain** — hundreds of TXT or NULL record queries
- **Uncommon record types** — TXT, NULL, MX used for tunneling (legitimate DNS rarely uses these at high volume)
- **Slow data rate, high count** — DNS packets are small; exfil takes many queries

```kql
// KQL: detect high-volume DNS queries to single domain (tunneling)
DnsEvents
| where TimeGenerated > ago(1h)
| summarize QueryCount=count(), UniqueSubdomains=dcount(Name) by ClientIP, extract(@"[^.]+\.[^.]+$", 0, Name)
| where QueryCount > 500 AND UniqueSubdomains > 100
```

## TLS Inspection Trade-offs

Decrypting TLS traffic provides visibility but introduces complexity and risk.

| Consideration | Detail |
|---|---|
| **Visibility gain** | Inspect payload of HTTPS, detect malware in encrypted channels |
| **Privacy risk** | Decrypted traffic may include credentials, personal data |
| **Certificate trust** | Requires deploying a corporate CA cert to all endpoints |
| **Performance** | SSL/TLS proxy adds latency; requires dedicated hardware |
| **Legal/compliance** | Some jurisdictions restrict decryption of personal communications |
| **Certificate pinning** | Apps that pin certificates will break under inspection |

**Alternative to full TLS inspection:** **JA3/JA3S fingerprinting** — hash of TLS Client Hello parameters; identifies client/server TLS behavior without decryption. Malware has characteristic JA3 fingerprints.

## Key NSM Exam Concepts

- Zeek produces **logs**, not alerts — it's an analysis platform, not an IDS
- Suricata and Snort produce **alerts** via signature matching
- **Flow data** is the right tool for detecting lateral movement at scale — low cost, behavioral
- **Beaconing** = low jitter, periodic, small payload connections to external IP
- **DNS tunneling** = high entropy subdomains, many TXT queries, high unique subdomain count
- TLS inspection requires **corporate CA deployment** on all endpoints
