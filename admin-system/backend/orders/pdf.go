package orders

import (
	"fmt"
	"net/http"

	"backend/db"

	"github.com/gin-gonic/gin"
)

// HandleGenerateQuotationPDF outputs a generated mock PDF for Quotation
func HandleGenerateQuotationPDF(c *gin.Context) {
	orderID := c.Param("id")

	storeMutex.RLock()
	order, exists := ordersStore[orderID]
	storeMutex.RUnlock()

	if !exists && db.DB != nil {
		var err error
		order, err = getOrderByIDFromDB(orderID)
		if err == nil {
			exists = true
		}
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=Quotation-%s.pdf", order.OrderNumber))
	c.Header("Content-Type", "application/pdf")

	itemsText := ""
	for idx, item := range order.Items {
		itemsText += fmt.Sprintf("0 -15 Td\n(%d. %s - Qty: %d @ %.0f LAK) Tj\n", idx+1, item.JobName, item.Quantity, item.UnitPriceSnapshot)
	}
	if itemsText == "" {
		itemsText = "0 -15 Td\n(No items specified) Tj\n"
	}

	streamContent := fmt.Sprintf("BT\n/F1 14 Tf\n50 800 Td\n(SOM SING PRINTING - OFFICIAL QUOTATION) Tj\n/F1 10 Tf\n0 -25 Td\n(Order Ref: %s) Tj\n0 -15 Td\n(Customer: %s | Phone: %s) Tj\n0 -15 Td\n(Date: %s) Tj\n0 -25 Td\n(JOB ITEMS BREAKDOWN:) Tj\n%s0 -30 Td\n(Deposit Paid: %.0f LAK) Tj\n0 -15 Td\n(TOTAL PRICE: %.0f LAK) Tj\nET",
		order.OrderNumber, order.CustomerName, order.CustomerPhone, order.CreatedAt.Format("2006-01-02"), itemsText, order.DepositAmount, order.TotalPrice)

	pdfContent := fmt.Sprintf("%%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length %d >>\nstream\n%s\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n312\n%%%%EOF", len(streamContent), streamContent)

	c.String(http.StatusOK, pdfContent)
}

// HandleGenerateDeliveryPDF outputs a generated mock PDF for Delivery Note
func HandleGenerateDeliveryPDF(c *gin.Context) {
	orderID := c.Param("id")

	storeMutex.RLock()
	order, exists := ordersStore[orderID]
	storeMutex.RUnlock()

	if !exists && db.DB != nil {
		var err error
		order, err = getOrderByIDFromDB(orderID)
		if err == nil {
			exists = true
		}
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=DeliveryNote-%s.pdf", order.OrderNumber))
	c.Header("Content-Type", "application/pdf")

	itemsText := ""
	for idx, item := range order.Items {
		itemsText += fmt.Sprintf("0 -15 Td\n(%d. %s - Qty: %d) Tj\n", idx+1, item.JobName, item.Quantity)
	}

	streamContent := fmt.Sprintf("BT\n/F1 14 Tf\n50 800 Td\n(SOM SING PRINTING - DELIVERY NOTE) Tj\n/F1 10 Tf\n0 -25 Td\n(Order Ref: %s) Tj\n0 -15 Td\n(Customer: %s | Phone: %s) Tj\n0 -15 Td\n(Status: %s) Tj\n0 -25 Td\n(DELIVERY ITEMS:) Tj\n%s0 -30 Td\n(Received by Signature: _______________________) Tj\nET",
		order.OrderNumber, order.CustomerName, order.CustomerPhone, order.Status, itemsText)

	pdfContent := fmt.Sprintf("%%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length %d >>\nstream\n%s\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n312\n%%%%EOF", len(streamContent), streamContent)

	c.String(http.StatusOK, pdfContent)
}
