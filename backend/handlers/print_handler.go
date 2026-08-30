package handlers

import (
	"bytes"
	"fmt"
	"image/jpeg"
	"net/http"
	"strconv"
	"strings"

	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/qr"
	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
	"gorm.io/gorm"

	"starter/backend/database"
	"starter/backend/models"
)

// Helper to generate QR code image bytes
func generateQRCode(text string) ([]byte, error) {
	qrCode, err := qr.Encode(text, qr.M, qr.Auto)
	if err != nil {
		return nil, err
	}
	qrCode, err = barcode.Scale(qrCode, 200, 200)
	if err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	err = jpeg.Encode(&buf, qrCode, nil)
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// GenerateSuratPDF generates Surat Toko Emas PDF (Pre-printed form / Nota Konstan)
func formatCurrencyPDF(value float64) string {
	s := fmt.Sprintf("%.0f", value)
	var result []string
	for i := len(s); i > 0; i -= 3 {
		if i-3 > 0 {
			result = append([]string{s[i-3 : i]}, result...)
		} else {
			result = append([]string{s[0:i]}, result...)
		}
	}
	return strings.Join(result, ".")
}

func GenerateSuratPDF(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	var transaction models.Transaction
	if err := database.DB.Preload("Items").Preload("Items.Product").Preload("Items.Product.GoldCategory").First(&transaction, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transaction"})
		return
	}

	// Create PDF: Landscape, Custom Size 16.5cm x 10.5cm (165x105 mm)
	pdf := gofpdf.NewCustom(&gofpdf.InitType{
		UnitStr: "mm",
		Size:    gofpdf.SizeType{Wd: 165, Ht: 105},
	})
	pdf.SetMargins(0, 0, 0)
	pdf.SetAutoPageBreak(false, 0)

	customerName := "-"
	customerAddress := "-"
	if transaction.MemberID != nil {
		var member models.Member
		if err := database.DB.First(&member, transaction.MemberID).Error; err == nil {
			customerName = member.Name
			customerAddress = member.Address
		}
	} else if transaction.CustomerName != "" {
		customerName = transaction.CustomerName
	}

	itemsPerPage := 3
	totalItems := len(transaction.Items)
	if totalItems == 0 {
		totalItems = 1
	}
	totalPages := (totalItems + itemsPerPage - 1) / itemsPerPage

	qrCodeBytes, qrErr := generateQRCode(fmt.Sprintf("https://pos.tokoemas.com/validate/%s", transaction.TransactionCode))

	for page := 1; page <= totalPages; page++ {
		pdf.AddPage()

		// Tanggal, Nama, Alamat
		// Rata kiri di X=140mm seperti format awal
		boxX := 135.0
		pdf.SetFont("Arial", "", 9)
		pdf.SetXY(boxX, 10)
		pdf.CellFormat(25, 5, transaction.CreatedAt.Format("02/01/2006"), "", 1, "L", false, 0, "")

		pdf.SetXY(boxX, 15)
		pdf.CellFormat(25, 5, customerName, "", 1, "L", false, 0, "")

		pdf.SetXY(boxX, 20)
		pdf.CellFormat(25, 5, customerAddress, "", 1, "L", false, 0, "")

		// Transaksi Item (Dimulai pada 35mm dari atas, supaya tidak terlalu jauh dengan header)
		y := 35.0
		pdf.SetFont("Arial", "", 9)

		startIdx := (page - 1) * itemsPerPage
		endIdx := startIdx + itemsPerPage
		if endIdx > len(transaction.Items) {
			endIdx = len(transaction.Items)
		}

		for i := startIdx; i < endIdx; i++ {
			tItem := transaction.Items[i]

			kadar := "-"
			purityPercent := ""
			if tItem.Product != nil && tItem.Product.GoldCategory.Name != "" {
				kadar = tItem.Product.GoldCategory.Name
				if tItem.Product.GoldCategory.Purity != nil && *tItem.Product.GoldCategory.Purity > 0 {
					purityPercent = fmt.Sprintf(" (%.0f%%)", (*tItem.Product.GoldCategory.Purity)*100)
				}
			}

			itemNameFull := fmt.Sprintf("%s %.2fgr%s", tItem.ItemName, tItem.Weight, purityPercent)

			pdf.SetXY(10, y)
			pdf.CellFormat(10, 5, strconv.Itoa(tItem.Quantity), "", 0, "C", false, 0, "")

			nameStr := itemNameFull
			if len(nameStr) > 35 {
				nameStr = nameStr[:32] + "..."
			}
			pdf.SetXY(20, y)
			pdf.CellFormat(60, 5, nameStr, "", 0, "L", false, 0, "")

			pdf.SetXY(80, y)
			pdf.CellFormat(15, 5, kadar, "", 0, "C", false, 0, "")

			pdf.SetXY(95, y)
			pdf.CellFormat(20, 5, fmt.Sprintf("%.2f", tItem.Weight), "", 0, "R", false, 0, "")

			pdf.SetXY(115, y)
			pdf.CellFormat(25, 5, formatCurrencyPDF(tItem.SubTotal), "", 0, "R", false, 0, "")

			y += 6.0
		}

		if totalPages > 1 {
			pdf.SetXY(10, 100)
			pdf.SetFont("Arial", "I", 7)
			pdf.CellFormat(30, 5, fmt.Sprintf("Hal. %d/%d", page, totalPages), "", 0, "L", false, 0, "")
		}

		if page == totalPages {
			var grandTotalWeight float64
			for _, item := range transaction.Items {
				grandTotalWeight += item.Weight
			}

			// Posisi Pembayaran & Total relatif di bawah item terakhir
			// Tambahkan sedikit spasi agar rapi
			yTotal := y + 5.0

			pdf.SetXY(70, yTotal)
			pdf.SetFont("Arial", "B", 9)
			pdf.CellFormat(25, 4, "TOTAL", "", 0, "L", false, 0, "")

			pdf.SetXY(95, yTotal)
			pdf.SetFont("Arial", "B", 9)
			pdf.CellFormat(20, 4, fmt.Sprintf("%.2f g", grandTotalWeight), "", 0, "R", false, 0, "")

			pdf.SetXY(115, yTotal)
			pdf.SetFont("Arial", "B", 9)
			pdf.CellFormat(25, 4, formatCurrencyPDF(transaction.GrandTotal), "", 1, "R", false, 0, "")

			if transaction.Discount > 0 {
				yTotal += 5
				pdf.SetXY(70, yTotal)
				pdf.SetFont("Arial", "", 8)
				pdf.CellFormat(25, 4, "Diskon", "", 0, "L", false, 0, "")
				pdf.SetXY(115, yTotal)
				pdf.CellFormat(25, 4, "- " + formatCurrencyPDF(transaction.Discount), "", 1, "R", false, 0, "")
			}

			if transaction.PaidAmount > 0 {
				yTotal += 5
				pdf.SetXY(70, yTotal)
				pdf.SetFont("Arial", "", 8)
				pdf.CellFormat(25, 4, "Tunai/Bayar", "", 0, "L", false, 0, "")
				pdf.SetXY(115, yTotal)
				pdf.CellFormat(25, 4, formatCurrencyPDF(transaction.PaidAmount), "", 1, "R", false, 0, "")
			}

			// QR Code ditempatkan lebih ke kiri dari label TOTAL, misalnya di X=45
			// Y bisa diletakkan di koordinat yang sama dengan dimulainya yTotal
			if qrErr == nil {
				opt := gofpdf.ImageOptions{ImageType: "JPEG"}
				qrName := fmt.Sprintf("qr_trx_%d", transaction.ID)
				pdf.RegisterImageOptionsReader(qrName, opt, bytes.NewReader(qrCodeBytes))
				pdf.ImageOptions(qrName, 115, yTotal + 12, 18, 18, false, opt, 0, "")
			}
		}
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=Surat_%s.pdf", transaction.TransactionCode))
	pdf.Output(c.Writer)
}

// GenerateLabelPDF generates fixed-size barcode label from Stock ID(s)
func GenerateLabelPDF(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" || idStr == "print-label" {
		idStr = c.Query("ids")
	}

	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No stock IDs provided"})
		return
	}

	idStrs := strings.Split(idStr, ",")
	var ids []uint64
	for _, s := range idStrs {
		if s == "" {
			continue
		}
		id, err := strconv.ParseUint(s, 10, 32)
		if err == nil {
			ids = append(ids, id)
		}
	}

	if len(ids) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid stock IDs"})
		return
	}

	sizeType := c.DefaultQuery("size", "small")

	var stocks []models.Stock
	if err := database.DB.Preload("Product").Preload("Product.GoldCategory").Where("id IN ?", ids).Find(&stocks).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stocks not found"})
		return
	}

	if len(stocks) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stocks not found"})
		return
	}

	var pdfWd, pdfHt float64
	if sizeType == "small" {
		pdfWd, pdfHt = 74, 23 // Sesuai labelMode "small" kertas ukuran 74x23
	} else {
		pdfWd, pdfHt = 40, 20
	}

	pdf := gofpdf.NewCustom(&gofpdf.InitType{
		UnitStr: "mm",
		Size:    gofpdf.SizeType{Wd: pdfWd, Ht: pdfHt},
	})
	pdf.SetMargins(0, 0, 0)
	pdf.SetAutoPageBreak(false, 0)

	if sizeType == "small" {
		for i := 0; i < len(stocks); i += 2 {
			pdf.AddPage()

			// Label kiri: QR di tepi kiri
			drawSmallLabel(pdf, stocks[i], 0, 37, false)

			// Label kanan: QR di tepi kanan
			if i+1 < len(stocks) {
				drawSmallLabel(pdf, stocks[i+1], 37, 37, true)
			}
		}
	} else {
		// Large layout unchanged - 1 per page
		for _, stock := range stocks {
			pdf.AddPage()
			qrCodeBytes, err := generateQRCode(stock.SerialNumber)
			if err != nil { continue }
			opt := gofpdf.ImageOptions{ImageType: "JPEG"}
			qrName := fmt.Sprintf("qr_%d", stock.ID)
			pdf.RegisterImageOptionsReader(qrName, opt, bytes.NewReader(qrCodeBytes))

			purity := "-"
			if stock.Product.GoldCategory.Name != "" {
				purity = stock.Product.GoldCategory.Name
			}
			price := stock.Product.CalculateSellPrice()

			pdf.SetXY(2, 2)
			pdf.SetFont("Arial", "B", 7)
			pdf.CellFormat(36, 3, stock.Product.Name, "", 2, "C", false, 0, "")

			pdf.SetFont("Arial", "", 6)
			pdf.CellFormat(36, 3, fmt.Sprintf("%s | %.2fg | Rp %s", purity, stock.Product.Weight, formatCurrencyPDF(price)), "", 2, "C", false, 0, "")

			pdf.ImageOptions(qrName, 14, 9, 10, 10, false, opt, 0, "")
			pdf.SetXY(2, 19)
			pdf.SetFont("Arial", "", 5)
			pdf.CellFormat(36, 2, stock.SerialNumber, "", 2, "C", false, 0, "")
		}
	}

	c.Header("Content-Type", "application/pdf")
	filename := fmt.Sprintf("Labels_%d.pdf", len(stocks))
	if len(stocks) == 1 {
		filename = fmt.Sprintf("Label_%s.pdf", stocks[0].SerialNumber)
	}
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=%s", filename))
	pdf.Output(c.Writer)
}

func drawSmallLabel(pdf *gofpdf.Fpdf, stock models.Stock, offsetX float64, sectionWidth float64, isRight bool) {
	qrCodeBytes, err := generateQRCode(stock.SerialNumber)
	if err != nil { return }

	opt := gofpdf.ImageOptions{ImageType: "JPEG"}
	qrName := fmt.Sprintf("qr_%d", stock.ID)
	pdf.RegisterImageOptionsReader(qrName, opt, bytes.NewReader(qrCodeBytes))

	qrSize := 10.0
	halfH := 11.5 // setengah tinggi kertas

	// QR di tepi: kiri untuk label kiri, kanan untuk label kanan, 0.5mm dari tepi
	var qrX float64
	if isRight {
		qrX = offsetX + sectionWidth - qrSize - 0.5
	} else {
		qrX = offsetX + 0.5
	}

	// QR ditengahkan vertikal dalam top half
	qrY := (halfH - qrSize) / 2.0
	pdf.ImageOptions(qrName, qrX, qrY, qrSize, qrSize, false, opt, 0, "")

	// Nama item di BAWAH (bottom half), max 20mm, tidak menyentuh QR
	nameStr := stock.Product.Name
	lineH   := 3.5
	textMaxW := 20.0
	bottomY  := halfH + 1.0 // mulai dari bawah garis tengah

	pdf.SetFont("Arial", "B", 6)
	if isRight {
		// Label kanan: teks rata kanan, 0.5mm dari tepi kanan kertas
		textX := 74.0 - textMaxW - 0.5
		pdf.SetXY(textX, bottomY)
		pdf.MultiCell(textMaxW, lineH, nameStr, "", "R", false)
	} else {
		// Label kiri: teks rata kiri, 0.5mm dari tepi kiri kertas
		textX := 0.5
		pdf.SetXY(textX, bottomY)
		pdf.MultiCell(textMaxW, lineH, nameStr, "", "L", false)
	}
}



// GenerateReceiptPDF generates simple thermal receipt
func GenerateReceiptPDF(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction ID"})
		return
	}

	var transaction models.Transaction
	if err := database.DB.Preload("Items").First(&transaction, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transaction"})
		return
	}

	// Ambil setting toko (nama, alamat, telepon)
	var settings []models.Setting
	database.DB.Where("key IN ?", []string{"store_name", "store_address", "store_phone"}).Find(&settings)

	storeName := "TOKO EMAS"
	storeAddress := ""
	storePhone := ""
	for _, s := range settings {
		if s.Key == "store_name" && s.Value != "" {
			storeName = s.Value
		} else if s.Key == "store_address" {
			storeAddress = s.Value
		} else if s.Key == "store_phone" {
			storePhone = s.Value
		}
	}

	// 80mm width thermal printer format
	pdf := gofpdf.NewCustom(&gofpdf.InitType{
		UnitStr: "mm",
		Size:    gofpdf.SizeType{Wd: 80, Ht: 200},
	})
	pdf.AddPage()
	pdf.SetMargins(3, 5, 3)

	// Header Toko (Rata Tengah / Proporsional)
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(74, 5, strings.ToUpper(storeName), "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "", 8)
	if storeAddress != "" {
		pdf.MultiCell(74, 4, storeAddress, "", "C", false)
	}
	if storePhone != "" {
		pdf.CellFormat(74, 4, "Telp: "+storePhone, "", 1, "C", false, 0, "")
	}
	pdf.Ln(4)

	// Info Transaksi
	pdf.SetFont("Arial", "", 8)
	pdf.CellFormat(74, 4, "TRX: "+transaction.TransactionCode, "", 1, "L", false, 0, "")
	pdf.CellFormat(74, 4, "Tgl: "+transaction.CreatedAt.Format("02/01/2006 15:04"), "", 1, "L", false, 0, "")
	pdf.Ln(2)

	pdf.CellFormat(74, 1, "", "T", 1, "C", false, 0, "") // Garis
	pdf.Ln(1)

	// Detail Barang
	var totalQty int
	for _, tItem := range transaction.Items {
		totalQty += tItem.Quantity

		// Baris 1: Nama Barang & Berat
		title := tItem.ItemName
		if tItem.Weight > 0 {
			title = fmt.Sprintf("%s (%.2fg)", tItem.ItemName, tItem.Weight)
		}
		pdf.CellFormat(74, 4, title, "", 1, "L", false, 0, "")

		// Baris 2: Qty x Harga & Subtotal
		pdf.CellFormat(40, 4, fmt.Sprintf("  %d x Rp %.0f", tItem.Quantity, tItem.PricePerGram*tItem.Weight), "", 0, "L", false, 0, "")
		pdf.CellFormat(34, 4, fmt.Sprintf("Rp %.0f", tItem.SubTotal), "", 1, "R", false, 0, "")
	}

	pdf.Ln(1)
	pdf.CellFormat(74, 1, "", "T", 1, "C", false, 0, "") // Garis
	pdf.Ln(1)

	// Summary
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(40, 5, "TOTAL", "", 0, "L", false, 0, "")
	pdf.CellFormat(34, 5, fmt.Sprintf("Rp %.0f", transaction.GrandTotal), "", 1, "R", false, 0, "")

	if transaction.PaidAmount > 0 {
		pdf.SetFont("Arial", "", 8)
		pdf.CellFormat(40, 4, "Tunai / Bayar", "", 0, "L", false, 0, "")
		pdf.CellFormat(34, 4, fmt.Sprintf("Rp %.0f", transaction.PaidAmount), "", 1, "R", false, 0, "")

		pdf.CellFormat(40, 4, "Kembali", "", 0, "L", false, 0, "")
		pdf.CellFormat(34, 4, fmt.Sprintf("Rp %.0f", transaction.ChangeAmount), "", 1, "R", false, 0, "")
	}

	pdf.Ln(5)
	pdf.SetFont("Arial", "", 8)
	pdf.CellFormat(74, 4, "Barang yang sudah dibeli tidak", "", 1, "C", false, 0, "")
	pdf.CellFormat(74, 4, "dapat dikembalikan / ditukar.", "", 1, "C", false, 0, "")
	pdf.Ln(2)
	pdf.CellFormat(74, 4, "*** TERIMA KASIH ***", "", 1, "C", false, 0, "")

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=Receipt_%s.pdf", transaction.TransactionCode))
	pdf.Output(c.Writer)
}