$(document).ready(function () {
    let footerAppended = false;

    $(document).on('click', '#download_acc_st', function () {



        let d_code = $('#download_acc_st_inp').val();

        if (!d_code) {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'Please Fill the input!',
            });
            return;
          }

        let dataTable = $('#csvTable').DataTable({
            ordering: false,
            paging: false,
        });


        $('#loader-div').removeClass('d-none')

        $.ajax({
            method: 'POST',
            url: '/download_ageing_report',
            data: { data: d_code },
            success: function (res) {
                $('#loader-div').addClass('d-none')

                $('#thead').empty();
                $('#tbody').empty();
                $('#pdftbody').empty();

                let headerAppended = false;



                res.data.sort((a, b) => new Date(a.Ageing_date) - new Date(b.Ageing_date));

                for (let i = 0; i < res.data.length; i++) {
                    let Company = res.data[i].Company;
                    let Company_Name = res.data[i].Company_Name;
                    let Customer_ID = res.data[i].Customer_ID;
                    let Customer_Name = res.data[i].Customer_Name;
                    let Outstanding_Amount = res.data[i].Outstanding_Amount;
                    let Amount_Not_Due = res.data[i].Amount_Not_Due;
                    let _0_To_30 = res.data[i]['0_To_30'];
                    let _31_To_60 = res.data[i]['31_To_60'];
                    let _61_To_90 = res.data[i]['61_To_90'];
                    let _91_To_120 = res.data[i]['91_To_120'];
                    let _121_To_180 = res.data[i]['121_To_180'];
                    let _181_To_365 = res.data[i]['181_To_365'];
                    let Greaterthan_365_Days = res.data[i]['Greaterthan_365_Days'];
                    let Unadjusted_Credit_Bal = res.data[i].Unadjusted_Credit_Bal;
                    let Ageing_date = formatDate(res.data[i].Ageing_date);

                    if (!headerAppended) {
                        $('#thead').append('<tr class="text-nowrap"><th>Company</th><th>Company Name</th><th>Customer ID</th><th>Customer Name</th><th>Outstanding Amount</th><th>Amount Not Due</th><th>0 To 30</th><th>31 To 60</th><th>61 To 90</th><th>91 To 120</th><th>121 To 180</th><th>181 To 365</th><th>> 365 Days</th><th>Unadjusted Credit Bal</th></tr>');
                        headerAppended = true;
                    }

                    $('#tbody').append('<tr class="text-nowrap"><td>' + Company + '</td><td>' + Company_Name + '</td><td>' + Customer_ID + '</td><td>' + Customer_Name + '</td><td>' + Outstanding_Amount + '</td><td>' + Amount_Not_Due + '</td><td>' + _0_To_30 + '</td><td>' + _31_To_60 + '</td><td>' + _61_To_90 + '</td><td>' + _91_To_120 + '</td><td>' + _121_To_180 + '</td><td>' + _181_To_365 + '</td><td>' + Greaterthan_365_Days + '</td><td>' + Unadjusted_Credit_Bal + '</td></tr>');

                    $('#pdftbody').append(`
    <tr class="text-center align-middle f_13 border-0">
        <td class="w_120 b border-top-0 ">${Company}</td>
        <td class="w_100 border-top-0 ">${Company_Name}</td>
        <td class="border-top-0 ">${Customer_ID}</td>
        <td class="border-top-0 ">${Customer_Name}</td>
        <td class="w_290 border-top-0 ">${Outstanding_Amount}</td>
        <td class="border-top-0 ">${Amount_Not_Due}</td>
        <td class="border-top-0 ">${_0_To_30}</td>
        <td class="border-top-0 ">${_31_To_60}</td>
        <td class="w_100 border-top-0 ">${_61_To_90}</td>
        <td class="border-top-0 ">${_91_To_120}</td>
        <td class="border-top-0 ">${_121_To_180}</td>
        <td class="border-top-0 ">${_181_To_365}</td>
        <td class="w_100 border-top-0 ">${Greaterthan_365_Days}</td>
        <td class="border-top-0 ">${Unadjusted_Credit_Bal}</td>
    </tr>
`);

                }



                dataTable.destroy();
                dataTable = $('#csvTable').DataTable({
                    ordering: false,
                    paging: true,
                });
            }
        });

        function getCurrentTime() {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');

            return `${hours}:${minutes}`;
        }

        const currentTime = getCurrentTime();
        console.log(currentTime);
    });
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
    link.setAttribute("download", "ageing_report" + distributorCode + ".csv");
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