export interface SystemLog {
  logId: number;
  logType: string;
  userName: string;
  loginId: string;
  action: string;
  detail: string;
  ipAddress: string;
  loggedAt: string;
}
