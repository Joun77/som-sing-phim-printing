import { OrderStatus7Step } from '../features/orders/types';

export interface StatusUpdateNotificationPayload {
  orderId: string;
  orderNumber: string;
  previousStatus: OrderStatus7Step | string;
  newStatus: OrderStatus7Step | string;
  updatedBy: {
    userId: string;
    userName: string;
    role: string;
  };
  timestamp: string;
  details: {
    assignedPrinter?: string;
    trackingNumber?: string;
    carrierName?: 'Anousith Express' | 'HAL Logistics' | 'Self Pickup' | string;
    proofVersion?: string;
    rejectionReason?: string;
    finishingNotes?: string;
    amountLAK?: number;
  };
}

/**
 * Format Lao Notification text payload for status transitions and activity logs.
 */
export function formatLaoNotificationMessage(payload: StatusUpdateNotificationPayload): string {
  const { orderNumber, previousStatus, newStatus, details } = payload;

  if (details.assignedPrinter) {
    return `ຈັດຄິວພິມສຳເລັດ: ມອບໝາຍອໍເດີ #${orderNumber} ໃສ່ເຄື່ອງພິມ [${details.assignedPrinter}]`;
  }

  if (details.carrierName && details.trackingNumber) {
    return `ບັນທຶກການຈັດສົ່ງສຳເລັດ: ອໍເດີ #${orderNumber} ຂົນສົ່ງໂດຍ [${details.carrierName}] - ໝາຍເລກ Tracking: [${details.trackingNumber}]`;
  }

  if (details.proofVersion) {
    return `ສົ່ງໄຟລ໌ປຣູຟສຳເລັດ: ອັບໂຫຼດ Digital Proof [${details.proofVersion}] ສໍາລັບອໍເດີ #${orderNumber} ຮຽບຮ້ອຍແລ້ວ`;
  }

  if (details.amountLAK) {
    return `ຢືນຢັນການຊຳລະເງິນສຳເລັດ: ອໍເດີ #${orderNumber} ຍອດເງິນ [₭ ${details.amountLAK.toLocaleString()}] ຜ່ານການກວດສອບແລ້ວ`;
  }

  return `ອັບເດດສະຖານະອໍເດີ #${orderNumber} ສໍາເລັດ: ປ່ຽນຈາກ [${previousStatus}] -> [${newStatus}]`;
}
