// $(document).ready(function () {
//     $('#exportPdfBtn').on('click', function () {
//         exportTableToPdf();
//     });

//     function exportTableToPdf() {
//         html2canvas(document.getElementById('yourTableId')).then(function(canvas) {
//             var imgData = canvas.toDataURL('image/png');
//             var pdf = new jsPDF('p', 'pt', 'letter');
//             var width = pdf.internal.pageSize.getWidth();
//             var height = pdf.internal.pageSize.getHeight();
//             pdf.addImage(imgData, 'PNG', 0, 0, width, height);
//             pdf.save('table_export.pdf');
//         });
//     }
// });
