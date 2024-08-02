$(document).ready(function () {
    $(document).on('click', '#save_ext', function () {
        $('#loader-div').removeClass('d-none')

        var tableData = [];

        $('#csvTable').DataTable().$('tr', { 'filter': 'applied' }).each(function (index, tr) {
            var rowData = {
                "CUST_NO": $(tr).find('td:eq(0)').text() || "null",
                "FIRM_NAME": $(tr).find('td:eq(1)').text() || "null",
                "DATE": $(tr).find('td:eq(2)').text() || "null",
                "COMP": $(tr).find('td:eq(3)').text() || "null",
                "TYPE": $(tr).find('td:eq(4)').text() || "null",
                "DOC_NO": $(tr).find('td:eq(5)').text() || "null",
                "REFERANCE": $(tr).find('td:eq(6)').text() || "null",
                "DEBIT": $(tr).find('td:eq(7)').text() ? formatDecimalValue($(tr).find('td:eq(7)').text()) : "null",
                "CREDIT": $(tr).find('td:eq(8)').text() ? formatDecimalValue($(tr).find('td:eq(8)').text()) : "null",
                "LINE_BALANCE": $(tr).find('td:eq(9)').text() ? formatDecimalValue($(tr).find('td:eq(9)').text()) : "null"
            };
            tableData.push(rowData);
            
        });

        function formatDecimalValue(value) {
            value = value.trim();        
            if (value === '' || isNaN(value)) {
                console.error(`Invalid or empty value: "${value}"`);
                return null;
            }        
            let floatValue = parseFloat(value);        
            if (floatValue % 1 === 0) {
                return floatValue.toFixed(2);
            }        
            return floatValue;
        }
        

        $.ajax({
            type: 'POST',
            url: '/upload_account_st',
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






document.getElementById('upload_btn').addEventListener('click', function () {

    var fileInput = document.getElementById('excel_upload');
    var saveExitBtn = document.getElementById('save_ext');

    if (fileInput.files.length > 0) {
        var file = fileInput.files[0];

        if (file.name.endsWith('.csv')) {
            var reader = new FileReader();

            // Show the loader
            $('#loader-div').removeClass('d-none')

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
                    if (i === 1) {
                        th.textContent = "FIRM_NAME";
                    } else {
                        th.textContent = headers[i];
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

                            if (k === 1) {
                                cell.textContent = rowData[headers.indexOf("FIRM_NAME")];
                            } else {
                                cell.textContent = rowData[k];
                            }

                            row.appendChild(cell);
                        }

                        fragment.appendChild(row);
                    }
                }

                tbody.appendChild(fragment);

                // Hide the loader
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













$(document).on('click','#reset',function(){
    window.location.reload()
})
