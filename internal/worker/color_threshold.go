package worker

import "math"

// PageType defines classification of a PDF page
type PageType string

const (
	PageTypeMonochrome PageType = "MONOCHROME"
	PageTypeColor      PageType = "COLOR"

	// ColorThresholdPercent is the 0.5% threshold. If C + M + Y < 0.5%, the page is Monochrome.
	ColorThresholdPercent = 0.50
)

// PageCMYKCoverage holds coverage metrics for an individual page
type PageCMYKCoverage struct {
	PageNumber int      `json:"page_number"`
	Cyan       float64  `json:"cyan"`
	Magenta    float64  `json:"magenta"`
	Yellow     float64  `json:"yellow"`
	Black      float64  `json:"black"`
	TotalColor float64  `json:"total_color"`
	PageType   PageType `json:"page_type"`
}

// JobCoverageSummary holds the aggregated result for the whole PDF
type JobCoverageSummary struct {
	TotalPages       int                `json:"total_pages"`
	ColorPagesCount  int                `json:"color_pages_count"`
	MonoPagesCount   int                `json:"mono_pages_count"`
	Pages            []PageCMYKCoverage `json:"pages"`
	AverageCyan      float64            `json:"avg_cyan"`
	AverageMagenta   float64            `json:"avg_magenta"`
	AverageYellow    float64            `json:"avg_yellow"`
	AverageBlack     float64            `json:"avg_black"`
	AverageCoverage  float64            `json:"avg_coverage"`
}

// ClassifyPage classifies a page as MONOCHROME or COLOR based on the 0.5% rule (C+M+Y < 0.5%)
func ClassifyPage(cyan, magenta, yellow float64) PageType {
	totalColor := cyan + magenta + yellow
	if totalColor < ColorThresholdPercent {
		return PageTypeMonochrome
	}
	return PageTypeColor
}

// BuildCoverageSummary aggregates coverage across all analyzed pages
func BuildCoverageSummary(pages []PageCMYKCoverage) JobCoverageSummary {
	summary := JobCoverageSummary{
		TotalPages: len(pages),
		Pages:      pages,
	}

	if len(pages) == 0 {
		return summary
	}

	var sumC, sumM, sumY, sumK, sumTot float64
	for _, p := range pages {
		if p.PageType == PageTypeColor {
			summary.ColorPagesCount++
		} else {
			summary.MonoPagesCount++
		}
		sumC += p.Cyan
		sumM += p.Magenta
		sumY += p.Yellow
		sumK += p.Black
		sumTot += (p.Cyan + p.Magenta + p.Yellow + p.Black)
	}

	n := float64(len(pages))
	summary.AverageCyan = round2(sumC / n)
	summary.AverageMagenta = round2(sumM / n)
	summary.AverageYellow = round2(sumY / n)
	summary.AverageBlack = round2(sumK / n)
	summary.AverageCoverage = round2(sumTot / n)

	return summary
}

func round2(val float64) float64 {
	return math.Round(val*100) / 100
}
