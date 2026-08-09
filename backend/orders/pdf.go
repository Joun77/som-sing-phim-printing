package orders

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// HandleGenerateQuotationPDF outputs a generated mock PDF for Quotation
func HandleGenerateQuotationPDF(c *gin.Context) {
	orderID := c.Param("id")

	storeMutex.RLock()
	order, exists := ordersStore[orderID]
	storeMutex.RUnlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=Quotation-%s.pdf", order.OrderNumber))
	c.Header("Content-Type", "application/pdf")

	pdfContent := fmt.Sprintf("%%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 200 >>\nstream\nBT\n/F1 12 Tf\n50 800 Td\n(SOM SING PRINTING - QUOTATION) Tj\n0 -20 Td\n(Order: %s) Tj\n0 -20 Td\n(Customer: %s) Tj\n0 -20 Td\n(Total Price: %.2f LAK) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n312\n%%%%EOF", order.OrderNumber, order.CustomerName, order.TotalPrice)

	c.String(http.StatusOK, pdfContent)
}

// HandleGenerateDeliveryPDF outputs a generated mock PDF for Delivery Note
func HandleGenerateDeliveryPDF(c *gin.Context) {
	orderID := c.Param("id")

	storeMutex.RLock()
	order, exists := ordersStore[orderID]
	storeMutex.RUnlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=DeliveryNote-%s.pdf", order.OrderNumber))
	c.Header("Content-Type", "application/pdf")

	pdfContent := fmt.Sprintf("%%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 200 >>\nstream\nBT\n/F1 12 Tf\n50 800 Td\n(SOM SING PRINTING - DELIVERY NOTE) Tj\n0 -20 Td\n(Order: %s) Tj\n0 -20 Td\n(Customer: %s) Tj\n0 -20 Td\n(Status: %s) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n312\n%%%%EOF", order.OrderNumber, order.CustomerName, order.Status)

	c.String(http.StatusOK, pdfContent)
}
