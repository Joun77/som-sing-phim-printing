package suppliers

import (
	"fmt"
	"net/http"
	"strings"

	"somsing.local/backend/db"

	"github.com/gin-gonic/gin"
)

// HandleGeneratePOPDF outputs a printable A4 Purchase Order document
func HandleGeneratePOPDF(c *gin.Context) {
	poIdentifier := c.Param("id")

	var po PurchaseOrder
	var supplier Supplier

	if db.DB != nil {
		err := db.DB.QueryRow(`
			SELECT 
				po.id::text, po.po_number, po.supplier_id::text, COALESCE(s.name, 'Supplier'),
				po.status::text, po.order_date::text, po.expected_delivery::text,
				po.total_amount, po.currency, COALESCE(po.notes, ''), COALESCE(po.created_by, 'ADMIN'),
				COALESCE(s.address, ''), COALESCE(s.phone, ''), COALESCE(s.tax_id, ''), COALESCE(s.payment_terms_days, 30)
			FROM purchase_orders po
			LEFT JOIN suppliers s ON po.supplier_id = s.id
			WHERE po.id = $1::uuid OR po.po_number = $1
		`, poIdentifier).Scan(
			&po.ID, &po.PONumber, &po.SupplierID, &po.SupplierName,
			&po.Status, &po.OrderDate, &po.ExpectedDelivery,
			&po.TotalAmount, &po.Currency, &po.Notes, &po.CreatedBy,
			&supplier.Address, &supplier.Phone, &supplier.TaxID, &supplier.PaymentTermsDays,
		)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Purchase Order not found"})
			return
		}

		rows, err := db.DB.Query(`
			SELECT id::text, po_id::text, description, quantity, unit, unit_price, total_price, received_qty
			FROM purchase_order_lines
			WHERE po_id = $1::uuid
			ORDER BY created_at ASC
		`, po.ID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var line POLineItem
				if err := rows.Scan(&line.ID, &line.POID, &line.Description, &line.Quantity, &line.Unit, &line.UnitPrice, &line.TotalPrice, &line.ReceivedQty); err == nil {
					po.Lines = append(po.Lines, line)
				}
			}
		}
	} else {
		po = PurchaseOrder{
			ID:           poIdentifier,
			PONumber:     poIdentifier,
			SupplierName: "Lao Paper Co., Ltd.",
			Status:       "SENT",
			OrderDate:    "2026-08-27",
			TotalAmount:  12500000,
			Currency:     "LAK",
			Lines: []POLineItem{
				{Description: "Art Paper 260gsm (Pack of 500 sheets)", Quantity: 10, Unit: "pack", UnitPrice: 450000, TotalPrice: 4500000},
				{Description: "Cyan Offset Ink (1kg can)", Quantity: 4, Unit: "can", UnitPrice: 350000, TotalPrice: 1400000},
			},
		}
	}

	var lineRows strings.Builder
	for i, line := range po.Lines {
		lineRows.WriteString(fmt.Sprintf(`
			<tr>
				<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">%d</td>
				<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">%s</td>
				<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">%.2f</td>
				<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">%s</td>
				<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">%s</td>
				<td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; font-family: monospace;">%s</td>
			</tr>
		`, i+1, line.Description, line.Quantity, line.Unit, fmt.Sprintf("%.2f", line.UnitPrice), fmt.Sprintf("%.2f", line.TotalPrice)))
	}

	htmlContent := fmt.Sprintf(`<!DOCTYPE html>
<html lang="lo">
<head>
	<meta charset="UTF-8">
	<title>Purchase Order %s - Som Sing Phim</title>
	<style>
		@page { size: A4; margin: 15mm; }
		body { font-family: 'Noto Sans Lao', 'Segoe UI', Tahoma, sans-serif; color: #1e293b; line-height: 1.5; font-size: 13px; }
		.header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
		.po-title { font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
		.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
		.card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
		.card h4 { margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #64748b; }
		table { width: 100%%; border-collapse: collapse; margin-bottom: 25px; }
		th { background: #0f172a; color: white; padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: left; }
		.total-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
		.total-box { width: 300px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
		.signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; text-align: center; }
		.sig-line { border-top: 1px solid #94a3b8; margin-top: 50px; padding-top: 8px; font-weight: 600; }
	</style>
</head>
<body onload="window.print()">
	<div class="header">
		<div>
			<div class="po-title">ໃບສັ່ງຊື້ (Purchase Order)</div>
			<div style="font-size: 14px; font-weight: 700; color: #475569;">ໂຮງພິມ ສົມສິ່ງພິມ (Som Sing Phim Printing)</div>
			<div style="font-size: 11px; color: #64748b;">ນະຄອນຫຼວງວຽງຈັນ, ສປປ ລາວ • ໂທ: +856 20 5555 8888</div>
		</div>
		<div style="text-align: right;">
			<div style="font-size: 18px; font-weight: 900; color: #2563eb; font-family: monospace;">%s</div>
			<div style="font-size: 12px; color: #64748b;">ວັນທີສັ່ງຊື້: %s</div>
			<div style="font-size: 12px; font-weight: 700; color: #059669;">ສະຖານະ: %s</div>
		</div>
	</div>

	<div class="info-grid">
		<div class="card">
			<h4>ຂໍ້ມູນຜູ້ສະໜອງ (Supplier / Vendor)</h4>
			<div style="font-size: 14px; font-weight: 700; color: #0f172a;">%s</div>
			<div style="color: #475569;">ທີ່ຢູ່: %s</div>
			<div style="color: #475569;">ໂທ: %s | ເລກປະຈຳຕົວຜູ້ເສຍພາສີ: %s</div>
		</div>
		<div class="card">
			<h4>ເງື່ອນໄຂການສັ່ງຊື້ ແລະ ຈັດສົ່ງ (Terms)</h4>
			<div><strong>ກຳນົດຊຳຣະເງິນ:</strong> ເຄຣດິດ %d ວັນ</div>
			<div><strong>ສະກຸນເງິນ:</strong> %s</div>
			<div><strong>ໝາຍເຫດ:</strong> %s</div>
		</div>
	</div>

	<table>
		<thead>
			<tr>
				<th style="width: 40px; text-align: center;">#</th>
				<th>ລາຍການວັດຖຸດິບ (Description)</th>
				<th style="width: 80px; text-align: right;">ຈຳນວນ</th>
				<th style="width: 70px; text-align: center;">ໜ່ວຍ</th>
				<th style="width: 120px; text-align: right;">ລາຄາ/ໜ່ວຍ</th>
				<th style="width: 130px; text-align: right;">ລວມເງິນ (%s)</th>
			</tr>
		</thead>
		<tbody>
			%s
		</tbody>
	</table>

	<div class="total-section">
		<div class="total-box">
			<div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #0f172a;">
				<span>ມູນຄ່າລວມທັງໝົດ:</span>
				<span style="color: #2563eb; font-family: monospace;">%s %s</span>
			</div>
		</div>
	</div>

	<div class="signatures">
		<div>
			<div class="sig-line">ຜູ້ຈັດຊື້ / ຜູ້ສັ່ງຊື້ (Purchaser)</div>
		</div>
		<div>
			<div class="sig-line">ຜູ້ຈັດການ / ຜູ້ມີອຳນາດອະນຸມັດ (Authorized Signer)</div>
		</div>
	</div>
</body>
</html>`,
		po.PONumber,
		po.PONumber,
		po.OrderDate,
		po.Status,
		po.SupplierName,
		supplier.Address,
		supplier.Phone,
		supplier.TaxID,
		supplier.PaymentTermsDays,
		po.Currency,
		po.Notes,
		po.Currency,
		lineRows.String(),
		fmt.Sprintf("%.2f", po.TotalAmount),
		po.Currency,
	)

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, htmlContent)
}
