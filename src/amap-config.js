/**
 * Module: Amap runtime config
 * Responsibility: Provide browser-side Amap JS API credentials for the static demo.
 * Input/Output: Exposes window.AMAP_CONFIG for the map bootstrap code.
 * Dependencies: Amap JS API v2.0 loader.
 * Notes: This is light obfuscation for a test-only public demo. Real protection
 * requires domain allowlists, key rotation, or a server-side proxy.
 */

const decodeConfigPart = (parts) => parts.map((part) => atob(part)).join("");

window.AMAP_CONFIG = {
  jsApiKey: decodeConfigPart([
    "ZjMzZGU5NWQ=",
    "MDhhMTVjN2I=",
    "ODYzNWE5OWQ=",
    "ODI3ZjRiOTE=",
  ]),
  securityJsCode: decodeConfigPart([
    "Y2Q3M2ExZGE=",
    "ODcyN2ZlZjk=",
    "ZTZiMGMwZjU=",
    "OGYxMGJlZGM=",
  ]),
};
