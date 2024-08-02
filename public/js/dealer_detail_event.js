$(function () {
    $("#datepicker").datepicker({
      dateFormat: 'dd-mm-yy',
      onSelect: function (selectedDate) {
        var startDate = $(this).datepicker('getDate');
        startDate.setDate(startDate.getDate() + 1);
        $("#datepicker2").datepicker("option", "minDate", startDate);
        var endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 60);
        $("#datepicker2").datepicker("option", "maxDate", endDate);
      }
    });
  
    $("#datepicker2").datepicker({
      dateFormat: 'dd-mm-yy',
    });
  });
  
  
  
  
  
  
  $(document).ready(function () {
  
  
   $(document).on('click', '#evt_run', function () {
  
  
      const sd = $('#datepicker').val();
      const ed = $('#datepicker2').val();
      var userInput = $('#searchInput').val().trim();
  
      if (!sd || !ed) {
          Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'Please Select Start Date & End Date!',
          });
          return;
      }
  
  
    $('#loader-div').removeClass('d-none')
      $.ajax({
          method: 'POST',
          url: '/dealer_detail_event',
          data: { sd: sd, ed: ed, userInput: userInput },
          success: function (res) {
              // console.log(res,'hh')
              $('#loader-div').addClass('d-none')
      
      
      
      
              const emp_id = res.emp
              $('#tbody').empty();
              $('#thead').empty();
  
  
    let headerAppended = false;
  
      
              // console.log(res.emp, 'empp')
              if (res.data.length === 0) {
                Swal.fire({
                  icon: 'info',
                  title: 'No Records Found',
                  text: 'No records match the specified criteria.',
                });
              } else {
      // console.log(1)
                for (let i = 0; i < res.data.length; i++) {
                  let emp_name = res.data[i].EMP_NAME;
                  let rep_manager_id = res.data[i].REP_MANAGER_ID;
                  let rep_manager_name = res.data[i].REP_MANAGER_NAME;
                  let branch = res.data[i].BRANCH;
                  let zone = res.data[i].ZONE;
<<<<<<< HEAD
                  let hqname=rowData.EMP_HQ_NAME;
                  let hqcode=rowData.EMP_HQ_CODE;
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
      
                    let rc_id = res.data[i].rc_id;
                    let emp_id = res.data[i].emp_id;
                    let DateOfMeet = formatDate(res.data[i].DateOfMeet);
                    // let Dealer_Code = res.data[i].Dealer_Code;
                    let Dealer_firm_Name = res.data[i].Dealer_firm_Name;
                    let Dealer_Name = res.data[i].Dealer_Name;
                    let Venue_City = res.data[i].City;
                    let Agenda = res.data[i].Agenda;
                    let Jacpl_Attended = res.data[i].Jacpl_Attended;
                    let Cond_By = res.data[i].Cond_By;
                    let Outcome = res.data[i].Outcome;
                    let MobileAttended = res.data[i].MobileAttended;
                    let mobileNumbers = MobileAttended.split(',');
                    let mobileCount = mobileNumbers.length;
                    let Meet_Type = res.data[i].Meet_Type;
                    let Budget = res.data[i].Budget;
                    let Expense = res.data[i].Expense;
                    let vertical = res.data[i].vertical;
                    let meeting_gift = res.data[i].meeting_gift;
                    let is_active = res.data[i].is_active;

      
                    let meetTypeText;
      
                    if (Meet_Type === 1) {
                      meetTypeText = 'In-Shop Meet';
                    } else if (Meet_Type === 2) {
                      meetTypeText = 'Contractor Meet';
                    } else if (Meet_Type === 3) {
                      meetTypeText = 'Dealer Meet';
                    } else {
                      meetTypeText = 'SGA Meet';
      
                    }
                    // console.log(2)






                    $.ajax({
                      method: 'POST',
                      url: '/is_active_status',
                      data: { is_active: is_active },
                      success: function (statusRes) {
                        let is_active_text = statusRes.actionStatus;
                    
                
                  let data;
                  for (let k = 0; k < res.data1[i].length; k++) {
                    // console.log(res.data1[i][k].Inf_Mobile)
                    
                    let mobileNumber = res.data1[i][k].Customer_Code;
                    let Customer_Name = res.data1[i][k].Customer_Name;
                    let Customer_Type = res.data1[i][k].Customer_Type;
                    let Contact_Person = res.data1[i][k].Contact_Person;
                    let Customer_Phone = res.data1[i][k].Customer_Phone;
                    let City = res.data1[i][k].City;
  


                    let rowBackground = '';
                          if (is_active_text[0] === 'Rejected By Your Manager' || is_active_text[0] === 'Rejected By Commercial Team') {
                            rowBackground = 'color: #cc0001 !important;'
                          }

                  //   console.log(3)
                  // var mobileNumber=9192881883198931
      data+=`<tr>
     <td class='stickybody1 fw-bold' style="${rowBackground}">${rc_id}</td>
     <td class='stickybody2' style="${rowBackground}">${branch}</td>
     <td style="${rowBackground}">${zone}</td>
     <td style="${rowBackground}">${emp_id}</td>
     <td style="${rowBackground}">${emp_name}</td>
<<<<<<< HEAD
       <td style="${rowBackground}">${hqname}</td>
      <td style="${rowBackground}">${hqcode}</td>
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
     <td style="${rowBackground}">${rep_manager_id}</td>
     <td style="${rowBackground}">${rep_manager_name}</td>
     <td style="${rowBackground}">${meetTypeText}</td>
     <td style="${rowBackground}">${DateOfMeet}</td>
     <td style="${rowBackground}">${Dealer_Name}</td>
     <td style="${rowBackground}">${Dealer_firm_Name}</td>
     <td style="${rowBackground}">${Venue_City}</td>
     <td style="${rowBackground}">${Agenda}</td>
     <td style="${rowBackground}">${mobileCount}</td>
    

     <td style="${rowBackground}">${Outcome}</td>
     <td style="${rowBackground}">${Cond_By}</td>
     <td style="${rowBackground}">${Jacpl_Attended}</td>
     <td style="${rowBackground}">${Budget}</td>
     <td style="${rowBackground}">${Expense}</td>
     <td style="${rowBackground}">${mobileNumber}</td>
     <td style="${rowBackground}">${Customer_Name}</td>
     <td style="${rowBackground}">${Customer_Type}</td>
     <td style="${rowBackground}">${Contact_Person}</td>
     <td style="${rowBackground}">${Customer_Phone}</td>
     <td style="${rowBackground}">${City}</td>
     <td style="${rowBackground}">${vertical}</td>
     <td style="${rowBackground}">${meeting_gift}</td>
     <td style="${rowBackground}">${is_active_text}</td>

   </tr>
   `
  
              
      
                  }
   $('#tbody').append(data);
             
                    
               
            
      
                    if (!headerAppended) {
                      $('#thead').html(`<tr>
                    <th class='stickyhead1'>ID</th>
                    <th class='stickyhead2'>Branch</th>
                    <th>Zone</th>
                    <th>Emp Id</th>
                    <th>Employee</th>
<<<<<<< HEAD
                     <th>HQ Name</th>
                    <th>HQ Code</th>
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
                    <th>Sup ID</th>
                    <th>Supervisor</th> 
                    
                    <th>Category</th>
                    <th>Event Date</th>
                    <th>Dealer Name</th>
                    <th>Venue</th>
                    <th>Venue City</th>
                    <th>Agenda</th>
                    <th>People Attended</th>
                   


                    <th>Outcome</th>
                    <th>ADE</th>
                    <th>Attended Jacpl</th>
                    <th>Budget(Rs.)</th>
                    <th>Expense (Rs.)</th>
                    <th>Customer Code</th>
                    <th>Customer Name</th>
                    <th>Customer Type</th>
                    <th>Contact Person</th>
                    <th>Customer Phone</th>
                    <th>Customer City</th>
                    <th>Vertical</th>
                    <th>Meeting Gift</th>
                    <th>Meet Status</th>

                  </tr>
                  `);
                      headerAppended = true;
                    }
      
                  },
                  error: function (error) {
                    console.error(error);
                  }
                });
      
                  
      
                  
                }
      
              }
      
      
      
      
            },
      
      
          error: function (error) {
              console.error(error);
          }
      });
      
  });
  
  });
  
<<<<<<< HEAD
  $(document).on('click', '#excel_btn', function () {
            let csvContent = "\uFEFF";
            let headers = $('#thead th').map(function () {
                let headerText = $(this).clone().children().remove().end().text();
                return headerText.replace(/[";]/g, "") || ' ';
            }).get();
            csvContent += headers.join(",") + "\n";
            $('#tbody tr').each(function () {
                let row = $(this).find('td').map(function () {
                    let cellText = $(this).text().replace(/[";]/g, ''); // Remove unwanted characters
                    return cellText.includes(',') ? '"' + cellText + '"' : cellText;
                }).get();
                // Join row data with commas, and replace newline characters with a space
                csvContent += row.join(",").replace(/\n/g, ' ') + "\n";
            });
            let encodedUri = encodeURI(csvContent);
            let link = document.createElement("a");
            link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
            link.setAttribute("download", "dealer_event_report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });  
=======
  
  
  
  $(document).on('click', '#excel_btn', function () {
    let csvContent = "\uFEFF"; 
  
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
  
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
    link.setAttribute("download", "detail_event"  + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  
  
  
  
  
  
  
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
  
  
  $(document).on('click', '#reset', function () {
    window.location.reload()
  })
  function formatDate(date) {
    return moment(date).format('DD-MM-YYYY');
<<<<<<< HEAD
  }
=======
  }
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
