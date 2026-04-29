/** Session helpers for the no-auth integration pass.
 *  Demo entity IDs are mapped from login email until Prompt 10 adds JWT auth.
 *  Seed the DB so these IDs exist before testing.
 */

interface DemoIds {
  empId?: number;
  passengerId?: number;
}

const DEMO_MAP: Record<string, DemoIds> = {
  "admin@aoms.com": { empId: 10 }, // Sanjay Gupta  — Admin
  "crew@aoms.com": { empId: 1 }, // Rajesh Kumar  — Pilot / Captain
  "ground@aoms.com": { empId: 6 }, // Amit Patel    — Ground_Staff
  "maintenance@aoms.com": { empId: 8 }, // Karan Mehta   — Maintenance
  "fuel@aoms.com": { empId: 9 }, // Pooja Iyer    — Fuel_Staff
  "passenger@aoms.com": { passengerId: 1 }, // Aarav Joshi
  "passenger2@aoms.com": { passengerId: 2 }, // Meera Pillai
};

export const session = {
  /** Called in RoleRoutingScreen to persist entity IDs. */
  setEntityIds(email: string) {
    sessionStorage.removeItem('displayName'); // clear cached display name for new session
    const ids = DEMO_MAP[email.toLowerCase()] ?? {};
    if (ids.empId) sessionStorage.setItem('empId', String(ids.empId));
    if (ids.passengerId) sessionStorage.setItem('passengerId', String(ids.passengerId));
  },

  getEmail: () => sessionStorage.getItem("userEmail") ?? "",
  getEmpId: () => Number(sessionStorage.getItem("empId") ?? 0),
  getPassengerId: () => Number(sessionStorage.getItem("passengerId") ?? 0),
  clear: () => sessionStorage.clear(),
};
