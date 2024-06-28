$(document).ready(function () {
    let footerAppended = false;


    $(document).on('click', '#download_acc_st', function () {



        let d_code = $('#download_acc_st_inp').val()

        if (!d_code) {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'Please Fill the input!',
            });
            return;
          }

        $('#loader-div').removeClass('d-none')


        let dataTable = $('#csvTable').DataTable({
            ordering: false,
            paging: false,
        });
        $.ajax({
            method: 'POST',
            url: '/download_account_st',
            data: { data: d_code },
            success: function (res) {

                $('#loader-div').addClass('d-none')


                $('#thead').empty();
                $('#tbody').empty();
                $('#pdftbody').empty();

                let headerAppended = false;

                const Firm_Name = res.data[0].FIRM_NAME
                console.log(Firm_Name)

                $('#firm_name').text('[' + Firm_Name + ']')

                $('#start_date').text('From: ' + res.start_date)
                $('#c_date').text('To: ' + res.currentDate)

                $('#date_time').text('Date: ' + res.currentDate)

                $('#c_details').text(' ' + d_code + ' ')
                $('#time_min').text('[' + currentTime + ']')
                let credit = res.sum_credit;
                let debit = res.sum_debit;
                let closingbalnce = debit - credit;
                closingbalance = parseFloat(closingbalnce.toFixed(2));


                res.data.sort((a, b) => new Date(a.DATE) - new Date(b.DATE));

                for (let i = 0; i < res.data.length; i++) {
                    let CUST_NO = res.data[i].CUST_NO;
                    let FIRM_NAME = res.data[i].FIRM_NAME;
                    let DATE = formatDate(res.data[i].DATE);
                    let COMP = res.data[i].COMP;
                    let TYPE = res.data[i].TYPE;
                    let DOC_NO = res.data[i].DOC_NO;
                    let REFERANCE = res.data[i].REFERANCE;
                    let DEBIT = formatDecimalValue(res.data[i].DEBIT);
                    let CREDIT = formatDecimalValue(res.data[i].CREDIT);
                    let LINE_BALANCE = formatDecimalValue(res.data[i].LINE_BALANCE);

                    // console.log(LINE_BALANCE);

                    if (!headerAppended) {
                        $('#thead').append('<tr><th>CUST_NO.</th><th>Firm Name</th><th>DATE</th><th>COMP</th><th>TYPE</th><th>DOC_NO</th><th>REFERANCE</th><th>DEBIT</th><th>CREDIT</th><th>LINE_BALANCE</th></tr>')
                        headerAppended = true;
                    }

                    $('#tbody').append('<tr><td>' + CUST_NO + '</td><td>' + FIRM_NAME + '</td><td>' + DATE + '</td><td>' + COMP + '</td><td>' + TYPE + '</td><td>' + DOC_NO + '</td><td>' + REFERANCE + '</td><td>' + DEBIT + '</td><td>' + CREDIT + '</td><td class="w_100">' + LINE_BALANCE + '</td></tr>')
                    $('#pdftbody').append(`
                    <tr class="text-center f_13 border-0">
                    <td class="w_120 b border-top-0 border-bottom-0">${DATE}</td>
                    <td class="w_100 border-top-0 border-bottom-0">${COMP}</td>
                    <td class="border-top-0 border-bottom-0">${TYPE}</td>
                    <td class="border-top-0 border-bottom-0">${DOC_NO}</td>
                    <td class="w_290 border-top-0 border-bottom-0">${REFERANCE}</td>
                    <td class="border-top-0 border-bottom-0">${DEBIT}</td>
                    <td class="border-top-0 border-bottom-0">${CREDIT}</td>
                    <td class="w_100 border-top-0 border-bottom-0">${LINE_BALANCE}</td>
                </tr>
                    `)

                }
                $('#pdftbody').append(`
                <tr class="border-0">
                <td colspan="5" class="text-center bd-t bd-l bd-r fw_bold f_13">Total: </td>
                <td class="f_13 fw_bold text-center bd-t bd-l bd-r bd-b">${res.sum_debit}</td>
                <td class="f_13 fw_bold text-center bd-t bd-l bd-r bd-b">${res.sum_credit}</td>
                <td rowspan="2" class=" bd-l bd-r bd-b"></td>
                </tr>
                <tr class="hdsh">
                <td colspan="5" class="text-center fw_bold f_13 border-top-0">Closing Balance: </td>
                
                <td class="f_13 fw_bold text-center bd-t bd-l bd-r bd-b">${closingbalance}</td>
                <td class="f_13 fw_bold bd-t bd-l bd-r bd-b"></td>
                </tr>
`);

                dataTable.destroy();
                dataTable = $('#csvTable').DataTable({
                    ordering: false,
                    paging: true,
                });
            }
        })



        function getCurrentTime() {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');

            return `${hours}:${minutes}`;
        }

        const currentTime = getCurrentTime();
        console.log(currentTime);
    })


});





$(document).on('click', '#excel_btn', function () {
    let csvContent = "\uFEFF";
    let d_code = $('#download_acc_st_inp').val()

    let headers = $('#thead th').map(function () {
        let headerText = $(this).clone().children().remove().end().text();
        return headerText.replace(/[";]/g, "") || ' ';
    }).get();
    csvContent += headers.join(",") + "\n";

    $('#tbody tr').each(function () {
        let row = $(this).find('td').map(function () {
            let cellText = $(this).text().replace(/"/g, '');
            return cellText.includes(',') ? '"' + cellText + '"' : cellText;
        }).get();
        csvContent += row.join(",") + "\n";
    });

    let distributorCode = d_code;
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
    link.setAttribute("download", "account_statement_" + distributorCode + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});










function formatDecimalValue(value) {
    let floatValue = parseFloat(value);
    return floatValue.toFixed(2);
}





function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
}


$(document).ready(function () {
    $('#reset').on('click', function () {
        location.reload();
    });
});

$(document).on('click', '#printButton', function () {
    window.print();
})















