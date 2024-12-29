// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { formatCurrency } from '$lib/stores/cart';
// import { APP_CONFIG } from '$lib/stores/app';
// import defaultApiClient from '$lib/api/client';

// // Generic interfaces
// interface ReportItem {
//     id: string;
//     quantity: number;
//     unit_price: string | number;
//     total_price: string | number;
//     [key: string]: any; // Allow additional properties
// }

// interface ReportConfig {
//     title: string;
//     documentTitle: string;
//     headerInfo: { label: string; value: string | number }[];
//     tableColumns: { header: string; key: string; format?: (value: any) => string }[];
//     items: ReportItem[];
//     summary?: { label: string; value: string | number }[];
// }

// // Generic report generator
// export async function generateReport(config: ReportConfig) {
//     // Initialize PDF with better default styling
//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.width;
//     const pageHeight = doc.internal.pageSize.height;
//     const margin = 15;

//     // Add logo
//     const img = new Image();
//     img.src = '/favicon.png';
//     doc.addImage(img, 'PNG', margin, margin, 20, 20);
    
//     // Add company name with improved styling
//     doc.setFontSize(24);
//     doc.setTextColor(41, 128, 185); // Professional blue
//     doc.text("Pharma-Care", 40, 25);
    
//     // Add report title with underline
//     doc.setFontSize(16);
//     doc.setTextColor(0, 0, 0);
//     doc.text(config.title, margin, 45);
//     doc.setLineWidth(0.5);
//     doc.line(margin, 47, pageWidth - margin, 47);

//     // Add header information with improved layout
//     doc.setFontSize(10);
//     let yPos = 55;
//     config.headerInfo.forEach(info => {
//         doc.text(`${info.label}: ${info.value}`, margin, yPos);
//         yPos += 7;
//     });

//     // Generate table with improved styling
//     const tableColumns = config.tableColumns.map(col => col.header);
//     const tableData = config.items.map(item => 
//         config.tableColumns.map(col => {
//             const value = item[col.key];
//             return col.format ? col.format(value) : value;
//         })
//     );

//     // Add table
//     autoTable(doc, {
//         startY: yPos + 10,
//         head: [tableColumns],
//         body: tableData,
//         styles: {
//             fontSize: 9,
//             cellPadding: 3,
//         },
//         headStyles: {
//             fillColor: [41, 128, 185],
//             textColor: 255,
//             fontStyle: 'bold',
//         },
//         alternateRowStyles: {
//             fillColor: [245, 245, 245],
//         },
//         columnStyles: {
//             // Add specific column styling if needed
//             total: { halign: 'right' },
//         },
//         margin: { top: 10 },
//     });

//     // Add summary information if provided
//     if (config.summary) {
//         const finalY = (doc as any).lastAutoTable.finalY || yPos;
//         let summaryY = finalY + 10;
        
//         config.summary.forEach(item => {
//             doc.setFontSize(10);
//             doc.text(
//                 item.label,
//                 pageWidth - margin - 50,
//                 summaryY,
//                 { align: 'right' }
//             );
//             doc.setFontSize(10);
//             doc.text(
//                 item.value.toString(),
//                 pageWidth - margin,
//                 summaryY,
//                 { align: 'right' }
//             );
//             summaryY += 7;
//         });
//     }

//     // Add footer with page numbers
//     // const pageCount = doc.internal.getNumberOfPages();
//     const pageCount = doc.internal.getNumberOfPages();
//     doc.setFontSize(8);
//     for(let i = 1; i <= pageCount; i++) {
//         doc.setPage(i);
//         doc.text(
//             `Page ${i} of ${pageCount}`,
//             pageWidth / 2,
//             pageHeight - 10,
//             { align: 'center' }
//         );
//         // Add timestamp and document title in footer
//         doc.text(
//             config.documentTitle,
//             margin,
//             pageHeight - 10
//         );
//         doc.text(
//             new Date().toLocaleString(),
//             pageWidth - margin,
//             pageHeight - 10,
//             { align: 'right' }
//         );
//     }

//     // Return blob URL for opening in new tab
//     const pdfOutput = doc.output('blob');
//     const pdfUrl = URL.createObjectURL(pdfOutput);
//     window.open(pdfUrl, '_blank');

//     // Cleanup
//     setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
// }

// // Specific generator for sales reports
// export async function generateSaleReport(
//     saleId: string,
//     saleDate: string,
//     totalAmount: string,
//     paymentMethod: string
// ) {
//     try {
//         // Fetch sale items
//         const items = await defaultApiClient.request<SaleItem[]>(
//             '/management/sale_items',
//             { params: { sale_id: saleId } }
//         );

//         // Configure report
//         const reportConfig: ReportConfig = {
//             title: 'Sale Report',
//             documentTitle: 'Sale Report',
//             headerInfo: [
//                 { label: 'Sale ID', value: saleId },
//                 { label: 'Date', value: new Date(saleDate).toLocaleString() },
//                 { label: 'Payment Method', value: paymentMethod },
//             ],
//             tableColumns: [
//                 { header: 'Product ID', key: 'product_id' },
//                 { header: 'Quantity', key: 'quantity' },
//                 { 
//                     header: 'Unit Price', 
//                     key: 'unit_price',
//                     format: value => formatCurrency(Number(value))
//                 },
//                 { 
//                     header: 'Total', 
//                     key: 'total_price',
//                     format: value => formatCurrency(Number(value))
//                 }
//             ],
//             items: items,
//             summary: [
//                 { 
//                     label: 'Subtotal',
//                     value: formatCurrency(Number(totalAmount) * 0.84) // Example: Excluding tax
//                 },
//                 { 
//                     label: 'Tax (16%)',
//                     value: formatCurrency(Number(totalAmount) * 0.16)
//                 },
//                 { 
//                     label: 'Total Amount',
//                     value: formatCurrency(Number(totalAmount))
//                 }
//             ]
//         };

//         // Generate report
//         await generateReport(reportConfig);

//     } catch (error) {
//         console.error('Error generating sale report:', error);
//         throw error;
//     }
// }


// interface PurchaseItem {
//    product_id: string;
//    product_name: string;
//    batch_number: string;
//    quantity: number;
//    unit_price: string;
//    purchase_total: string;
// }

// export async function generatePurchaseReport(
//    purchaseId: string, 
//    purchaseDate: string,
//    totalAmount: string,
//    supplierName: string,
//    reference: string
// ) {
//    const doc = new jsPDF();
//    const pageWidth = doc.internal.pageSize.width;
//    const margin = 15;

//    // Add logo
//    const img = new Image();
//    img.src = '/favicon.png';
//    doc.addImage(img, 'PNG', margin, margin, 20, 20);
   
//    // Header with company name
//    doc.setFontSize(24);
//    doc.setTextColor(41, 128, 185);
//    doc.text("Pharma-Care", 40, 25);
   
//    // Report title with underline
//    doc.setFontSize(16);
//    doc.setTextColor(0, 0, 0);
//    doc.text("Purchase Order", margin, 45);
//    doc.setLineWidth(0.5);
//    doc.line(margin, 47, pageWidth - margin, 47);

//    // Purchase information
//    doc.setFontSize(10);
//    let yPos = 55;
//    [
//        { label: 'Purchase ID', value: purchaseId },
//        { label: 'Reference', value: reference },
//        { label: 'Date', value: new Date(purchaseDate).toLocaleString() },
//        { label: 'Supplier', value: supplierName }
//    ].forEach(info => {
//        doc.text(`${info.label}: ${info.value}`, margin, yPos);
//        yPos += 7;
//    });

//    try {
//        // Fetch purchase items
//        const items = await defaultApiClient.request<PurchaseItem[]>('/management/v_purchase_orders', {
//            params: { purchase_id: purchaseId }
//        });

//        // Generate items table
//        autoTable(doc, {
//            startY: yPos + 10,
//            head: [['Product', 'Batch #', 'Quantity', 'Unit Price', 'Total']],
//            body: items.map(item => [
//                item.product_name,
//                item.batch_number,
//                item.quantity,
//                formatCurrency(Number(item.unit_price)),
//                formatCurrency(Number(item.purchase_total))
//            ]),
//            styles: {
//                fontSize: 9,
//                cellPadding: 3,
//            },
//            headStyles: {
//                fillColor: [41, 128, 185],
//                textColor: 255,
//                fontStyle: 'bold',
//            },
//            alternateRowStyles: {
//                fillColor: [245, 245, 245],
//            },
//            columnStyles: {
//                3: { halign: 'right' },
//                4: { halign: 'right' },
//            },
//        });

//        // Add summary
//        const finalY = (doc as any).lastAutoTable.finalY + 10;
       
//        // Calculate subtotal and tax
//        const subtotal = Number(totalAmount);
//        const tax = subtotal * 0.16; // 16% tax

//        // Summary section
//        doc.setFontSize(10);
//        [
//            { label: 'Subtotal', value: formatCurrency(subtotal) },
//            { label: 'Tax (16%)', value: formatCurrency(tax) },
//            { label: 'Total Amount', value: formatCurrency(subtotal + tax) }
//        ].forEach((item, index) => {
//            doc.text(
//                item.label,
//                pageWidth - margin - 50,
//                finalY + (index * 7),
//                { align: 'right' }
//            );
//            doc.text(
//                item.value,
//                pageWidth - margin,
//                finalY + (index * 7),
//                { align: 'right' }
//            );
//        });

//        // Add footer
//        const pageHeight = doc.internal.pageSize.height;
//        doc.setFontSize(8);
//        doc.text(
//            'Purchase Order',
//            margin,
//            pageHeight - 10
//        );
//        doc.text(
//            new Date().toLocaleString(),
//            pageWidth - margin,
//            pageHeight - 10,
//            { align: 'right' }
//        );

//        // Open in new tab
//        const pdfOutput = doc.output('blob');
//        const pdfUrl = URL.createObjectURL(pdfOutput);
//        window.open(pdfUrl, '_blank');
//        setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);

//    } catch (error) {
//        console.error('Error generating purchase report:', error);
//        throw error;
//    }
// }