document.getElementById('upload_btn').addEventListener('click', function () {
    $('#loader-div').removeClass('d-none')

    var fileInput = document.getElementById('excel_upload');
    var saveExitBtn = document.getElementById('save_ext');

    if (fileInput.files.length > 0) {
        var file = fileInput.files[0];

        if (file.name.endsWith('.csv')) {
            var reader = new FileReader();

            // Show the loader

            reader.onload = function (e) {
                var csvData = e.target.result;

                var rows = csvData.split('\n');

                var thead = document.getElementById('csvTableHead');
                var tbody = document.getElementById('csvTableBody');
                var csvTable = document.getElementById('csvTable');

                thead.innerHTML = '';
                tbody.innerHTML = '';

                var headerRow = thead.insertRow(0);
                var headers = rows[0].split(',');

                for (var i = 0; i < headers.length; i++) {
                    var th = document.createElement('th');
                    switch (headers[i].trim()) {
                        case 'Company':
                            th.textContent = "Company";
                            break;
                        case 'Company_Name':
                            th.textContent = "Company Name";
                            break;
                        case 'Customer_ID':
                            th.textContent = "Customer ID";
                            break;
                        case 'Customer_Name':
                            th.textContent = "Customer Name";
                            break;
                        case 'Outstanding_Amount':
                            th.textContent = "Outstanding Amount";
                            break;
                        case 'Amount_Not_Due':
                            th.textContent = "Amount Not Due";
                            break;
                        case '0_To_30':
                            th.textContent = "0 To 30";
                            break;
                        case '31_To_60':
                            th.textContent = "31 To 60";
                            break;
                        case '61_To_90':
                            th.textContent = "61 To 90";
                            break;
                        case '91_To_120':
                            th.textContent = "91 To 120";
                            break;
                        case '121_To_180':
                            th.textContent = "121 To 180";
                            break;
                        case '181_To_365':
                            th.textContent = "181 To 365";
                            break;
                        case '>Greaterthan_365_Days':
                            th.textContent = "> 365 Days";
                            break;
                        case 'Unadjusted_Credit_Bal':
                            th.textContent = "Unadjusted Credit Balance";
                            break;
                        case 'Ageing_date':
                            th.textContent = "Ageing Date";
                            break;
                        default:
                            th.textContent = headers[i];
                            break;
                    }
                    headerRow.appendChild(th);
                }

                var fragment = document.createDocumentFragment();

                for (var j = 1; j < rows.length; j++) {
                    var rowData = rows[j].split(',');

                    if (rowData.length > 1) {
                        var row = document.createElement('tr');

                        for (var k = 0; k < headers.length; k++) {
                            var cell = document.createElement('td');
                            cell.textContent = rowData[k];
                            row.appendChild(cell);
                        }

                        fragment.appendChild(row);
                    }
                }

                tbody.appendChild(fragment);

                $('#loader-div').addClass('d-none')

                fileInput.setAttribute('disabled', 'true');
                saveExitBtn.removeAttribute('disabled');

                csvTable.classList.add('height_501');
            };

            reader.readAsText(file);
        } else {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Please select a CSV file.",
                footer: '<a href="#">Why do I have this issue?</a>'
            });
            saveExitBtn.setAttribute('disabled', 'true');
        }
    } else {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Please select a file before clicking 'Upload'.",
            footer: '<a href="#">Why do I have this issue?</a>'
        });
        saveExitBtn.setAttribute('disabled', 'true');
    }
});




$(document).ready(function () {
    $(document).on('click', '#save_ext', function () {
        $('#loader-div').removeClass('d-none')

        var tableData = [];

        $('#csvTable').DataTable().$('tr', { 'filter': 'applied' }).each(function (index, tr) {
            var rowData = {
                "Company": $(tr).find('td:eq(0)').text(),
                "Company_Name": $(tr).find('td:eq(1)').text(),
                "Customer_ID": $(tr).find('td:eq(2)').text(),
                "Customer_Name": $(tr).find('td:eq(3)').text(),
                "Outstanding_Amount": formatDecimalValue($(tr).find('td:eq(4)').text()), 
                "Amount_Not_Due": formatDecimalValue($(tr).find('td:eq(5)').text()), 
                "0_To_30": formatDecimalValue($(tr).find('td:eq(6)').text()), 
                "31_To_60": formatDecimalValue($(tr).find('td:eq(7)').text()), 
                "61_To_90": formatDecimalValue($(tr).find('td:eq(8)').text()), 
                "91_To_120": formatDecimalValue($(tr).find('td:eq(9)').text()), 
                "121_To_180": formatDecimalValue($(tr).find('td:eq(10)').text()), 
                "181_To_365": formatDecimalValue($(tr).find('td:eq(11)').text()), 
                "Greaterthan_365_Days": formatDecimalValue($(tr).find('td:eq(12)').text()), 
                "Unadjusted_Credit_Bal": formatDecimalValue($(tr).find('td:eq(13)').text()), 
                "Ageing_date": $(tr).find('td:eq(14)').text()
            };
            tableData.push(rowData);
        });

        function formatDecimalValue(value) {
            let floatValue = parseFloat(value);
        
            if (!isNaN(floatValue)) {
                return floatValue.toFixed(2);
            } else {
                return "";
            }
        }

        $.ajax({
            type: 'POST',
            url: '/upload_ageing_report',
            data: { data: JSON.stringify(tableData) },
            success: function (response) {

                $('#loader-div').addClass('d-none')

                if(response.dup_data){
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: "Can't Upload duplicate Data!",
                      });
                }else{
                Swal.fire({
                    title: "Good job!",
                    text: "Data Saved",
                    icon: "success",
                    confirmButtonText: "Exit",
                    footer: '<a href="/">Why do I have this issue?</a>'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = "/super_admin_dashboard";
                    }
                });
            }

            },
            error: function (error) {
                $('#loader-div').addClass('d-none')
                console.error("Error saving data:", error);
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "An error occurred while saving data.",
                    footer: '<a href="#">Why do I have this issue?</a>'
                });
            }
        });
    });

    
});


$(document).ready(function () {
    $('#reset').on('click', function () {
        location.reload();
    });
});
