<?php
// ============================================================
// PasabayBCD - PDF Report Generator
// Using FPDF Library - http://www.fpdf.org/
// ============================================================

// Start output buffering FIRST to prevent "headers already sent"
ob_start();

error_reporting(E_ALL);
ini_set('display_errors', 1); // Temporarily show errors for debugging

require_once 'config.php';
require_once 'auth_check.php';

// Include FPDF with absolute path to avoid path resolution issues
require_once __DIR__ . '/libs/fpdf.php';

class PasabayReport extends FPDF {
    function Header() {
        $this->SetFont('Helvetica', 'B', 15);
        $this->SetTextColor(26, 86, 219);
        $this->Cell(0, 10, 'PasabayBCD Logistics Hub', 0, 1, 'C');
        $this->SetFont('Helvetica', 'I', 10);
        $this->SetTextColor(128, 128, 128);
        $this->Cell(0, 8, 'Bacolod City SME Logistics Audit Report', 0, 1, 'C');
        $this->SetFont('Helvetica', '', 9);
        $this->SetTextColor(160, 160, 160);
        $this->Cell(0, 6, 'Generated: ' . date('F j, Y - g:i A'), 0, 1, 'C');
        $this->Ln(4);
        $this->SetDrawColor(26, 86, 219);
        $this->SetLineWidth(0.5);
        $this->Line(10, $this->GetY(), 200, $this->GetY());
        $this->Ln(6);
    }

    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Helvetica', 'I', 8);
        $this->SetTextColor(150, 150, 150);
        $this->Cell(0, 10, 'Page ' . $this->PageNo() . '/{nb}  |  PasabayBCD Admin Report', 0, 0, 'C');
    }

    function BookingTable($header, $data) {
        // Table header
        $this->SetFillColor(26, 86, 219);
        $this->SetTextColor(255, 255, 255);
        $this->SetDrawColor(21, 67, 171);
        $this->SetLineWidth(0.3);
        $this->SetFont('Helvetica', 'B', 9);

        $w = array(32, 40, 28, 25, 30, 35);
        for ($i = 0; $i < count($header); $i++) {
            $this->Cell($w[$i], 7, $header[$i], 1, 0, 'C', true);
        }
        $this->Ln();

        // Table body
        $this->SetFillColor(245, 247, 250);
        $this->SetTextColor(30, 30, 30);
        $this->SetFont('Helvetica', '', 8);

        if (empty($data)) {
            $this->Cell(array_sum($w), 10, 'No booking records found.', 1, 1, 'C');
            return;
        }

        $fill = false;
        foreach ($data as $row) {
            $bookingId = isset($row['id']) ? substr($row['id'], 0, 10) : 'N/A';
            $merchant = isset($row['merchant_name']) ? substr($row['merchant_name'], 0, 20) : 'N/A';
            $category = isset($row['cargo_category']) ? $row['cargo_category'] : 'N/A';
            $weight = isset($row['cargo_weight_kg']) ? $row['cargo_weight_kg'] . 'kg' : '0kg';
            $fee = isset($row['estimated_fee']) ? 'P' . number_format((float)$row['estimated_fee'], 2) : 'P0.00';
            $status = isset($row['status']) ? ucfirst($row['status']) : 'N/A';

            $this->Cell($w[0], 6, $bookingId, 'LR', 0, 'L', $fill);
            $this->Cell($w[1], 6, $merchant, 'LR', 0, 'L', $fill);
            $this->Cell($w[2], 6, $category, 'LR', 0, 'L', $fill);
            $this->Cell($w[3], 6, $weight, 'LR', 0, 'R', $fill);
            $this->Cell($w[4], 6, $fee, 'LR', 0, 'R', $fill);
            $this->Cell($w[5], 6, $status, 'LR', 0, 'C', $fill);
            $this->Ln();
            $fill = !$fill;
        }
        $this->Cell(array_sum($w), 0, '', 'T');
    }
}

// --- Main Execution ---
try {
    $conn = get_db_connection();

    // Load booking data
    $data = [];
    if ($conn) {
        $stmt = $conn->query("
            SELECT b.id, u.merchant_name, b.cargo_category, b.cargo_weight_kg, b.estimated_fee, b.status 
            FROM pasabaybcd_bookings b
            LEFT JOIN pasabaybcd_users u ON b.user_id = u.id
            ORDER BY b.created_at DESC
            LIMIT 50
        ");
        if ($stmt) {
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }

    // Build PDF
    $pdf = new PasabayReport();
    $pdf->AliasNbPages();
    $pdf->SetAutoPageBreak(true, 20);
    $pdf->AddPage();

    // Section title
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetTextColor(30, 30, 30);
    $pdf->Cell(0, 10, 'Logistics Flow - Recent Bookings (' . count($data) . ' records)', 0, 1, 'L');
    $pdf->Ln(2);

    // Table
    $header = array('Booking ID', 'Merchant', 'Category', 'Weight', 'Fee', 'Status');
    $pdf->BookingTable($header, $data);

    // Clean any previous output (session headers, whitespace, etc.)
    ob_end_clean();

    // Hide errors for clean PDF output
    ini_set('display_errors', 0);
    
    // Output the PDF inline (in-browser)
    $pdf->Output('I', 'PasabayBCD_Report_' . date('Y-m-d') . '.pdf');

} catch (Exception $e) {
    ob_end_clean();
    header('Content-Type: text/html; charset=utf-8');
    echo '<h3>Report Generation Error</h3>';
    echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
    echo '<p><a href="dashboard.php">Back to Dashboard</a></p>';
}
