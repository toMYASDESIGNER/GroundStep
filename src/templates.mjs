export const scenarios = {
  router: {
    id: "router",
    name: "Restore a home router",
    goal: "Restore the internet connection without guessing or skipping safety checks.",
    steps: [
      {
        id: "inspect",
        title: "Inspect the setup",
        instruction: "Photograph the router, power adapter, and visible cables before touching anything.",
        expectedEvidence: "The router and cable ends are visible, the area is dry, and no cable or connector appears damaged.",
        safety: "Stop if you see water, heat damage, exposed conductors, smoke, or swelling.",
        critical: true
      },
      {
        id: "power",
        title: "Connect power",
        instruction: "Insert the matching power adapter into the router's DC-IN socket, then photograph the connection.",
        expectedEvidence: "The barrel connector is fully seated in DC-IN and the cable is not under tension.",
        safety: "Use only the adapter specified for the router.",
        critical: true
      },
      {
        id: "wan",
        title: "Connect the internet cable",
        instruction: "Insert the incoming internet cable into the WAN/Internet port and photograph the port labels.",
        expectedEvidence: "The cable is latched into the port labelled WAN or Internet, not a numbered LAN port.",
        safety: "Do not force the connector. Its latch should face the port notch.",
        critical: true
      },
      {
        id: "lights",
        title: "Verify the result",
        instruction: "Wait up to two minutes, then photograph the full router status panel.",
        expectedEvidence: "Power is stable and the Internet/WAN indicator shows the router's normal connected state.",
        safety: "If the router becomes unusually hot or smells burnt, disconnect power.",
        critical: false
      }
    ]
  },
  "digi-router": {
    id: "digi-router",
    name: "Recover a DIGI router connection",
    goal: "Reconnect the incoming network cable to the correct port and prove that service is restored.",
    steps: [
      {
        id: "inspect",
        title: "Inspect the disconnected setup",
        instruction: "Photograph the router ports, loose Ethernet cables, and power area before reconnecting anything.",
        expectedEvidence: "The router, loose cable ends, Ethernet ports, and power area are visible on a dry surface with no obvious damage.",
        safety: "Stop if you see liquid, heat damage, exposed conductors, smoke, or a swollen power adapter.",
        critical: true
      },
      {
        id: "identify-wan",
        title: "Identify the WAN port",
        instruction: "Photograph the Ethernet bank close enough that every port label is readable.",
        expectedEvidence: "WAN and the numbered LAN labels are simultaneously visible and the WAN port can be identified without relying on cable color.",
        safety: "Do not insert a connector until the WAN label is clearly identified.",
        critical: true
      },
      {
        id: "connect-wan",
        title: "Connect the incoming cable to WAN",
        instruction: "Insert the incoming network cable into WAN and photograph the connection with the label visible.",
        expectedEvidence: "The incoming cable is visibly latched into WAN; numbered LAN ports may contain only local-device cables.",
        safety: "Do not force the connector. The latch should align with the socket notch.",
        critical: true
      },
      {
        id: "verify-service",
        title: "Verify the service indicator",
        instruction: "Wait for the router to settle, then photograph its status indicator and connected cables.",
        expectedEvidence: "The router remains powered and its service indicator reaches the known connected green state.",
        safety: "Disconnect power if the router becomes unusually hot or smells burnt.",
        critical: false
      }
    ]
  }
};

export function getScenario(id) {
  const scenario = scenarios[id];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${id}. Available: ${Object.keys(scenarios).join(", ")}`);
  }
  return structuredClone(scenario);
}
