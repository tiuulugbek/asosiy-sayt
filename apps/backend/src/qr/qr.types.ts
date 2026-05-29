export type QrJwtPayload = {
  sub: number;
  loginType: 'branch' | 'super_admin' | 'analyst';
  branchId: string | null;
  displayName: string;
};

export type QrRequestUser = QrJwtPayload & {
  accountId: number;
};

export type QrFilterInput = {
  from?: Date;
  to?: Date;
  branchId?: string;
  qrCodeId?: number;
  destinationUrl?: string;
  status?: 'active' | 'paused' | 'expired';
  campaignName?: string;
};
