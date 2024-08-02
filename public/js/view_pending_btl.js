$( function() {
    $( "#datepicker" ).datepicker({
      dateFormat: 'dd-mm-yy',
      onSelect: function(selectedDate) {
        var startDate = $(this).datepicker('getDate');
        startDate.setDate(startDate.getDate() + 1); 
        $( "#datepicker2" ).datepicker("option", "minDate", startDate);
        var endDate = new Date(startDate); 
        endDate.setDate(endDate.getDate() + 60); 
        $( "#datepicker2" ).datepicker("option", "maxDate", endDate); 
      }
    });
  
    $( "#datepicker2" ).datepicker({
      dateFormat: 'dd-mm-yy',
    });
  });
  $(document).on('click','#reset',function(){
    window.location.reload()
  })
  function formatDate(date) {
    return moment(date).format('DD-MM-YYYY');
  }  


  function formatDate(date) {
    return moment(date).format('DD-MM-YYYY');
  }
  
  $(document).ready(function () {
    
  
    $(document).on('click', '#evt_run', function () {


      const sd = $('#datepicker').val();
      const ed = $('#datepicker2').val();
      var userInput = $('#searchInput').val().trim();
  
<<<<<<< HEAD
      if ((!sd || !ed) && userInput.length === 0) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please Select Start Date & End Date or Enter Search Input!',
        });
        return;
    }
=======
      if (!sd || !ed) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Please Select Start Date & End Date!',
        });
        return;
      }
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
  
      
      $('#loader-div').removeClass('d-none')
  
      $.ajax({
        method: 'POST',
        url: '/filter_view_pending_btl',
        data: { sd: sd, ed: ed,userInput: userInput },
        success: function (res) {

          $('#loader-div').addClass('d-none')

          $('#thead').empty();
          $('#tbody').empty();
          let headerAppended = false;
  
          if (res.data.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'No Records Found',
                text: 'No records match the specified criteria.',
            });
        } else {
  
  
          for (let j = 0; j < res.data.length; j++) {
            let emp_name = res.data[j].EMP_NAME;
            let rep_manager_id = res.data[j].REP_MANAGER_ID;
            let rep_manager_name = res.data[j].REP_MANAGER_NAME;
            let branch = res.data[j].BRANCH;
            let zone = res.data[j].ZONE;
<<<<<<< HEAD
            let hqname=res.data[j].EMP_HQ_NAME;
            let hqcode=res.data[j].EMP_HQ_CODE;
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
  
              let rc_id = res.data[j].rc_id;
              let emp_id = res.data[j].emp_id;
              let DateOfMeet = formatDate(res.data[j].DateOfMeet);
              let Dealer_Code = res.data[j].Dealer_Code;
              let Dealer_firm_Name = res.data[j].Dealer_firm_Name;
              let Dealer_Name = res.data[j].Dealer_Name;
              let City = res.data[j].City;
              let Agenda = res.data[j].Agenda;
              let Jacpl_Attended = res.data[j].Jacpl_Attended;
              let Cond_By = res.data[j].Cond_By;
              let Outcome = res.data[j].Outcome;
              let MobileAttended = res.data[j].MobileAttended;
              let mobileNumbers = MobileAttended.split(',');            
              let mobileCount = mobileNumbers.length;           
              let Meet_Type = res.data[j].Meet_Type;
<<<<<<< HEAD
=======
              alert(Meet_Type)
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
              let Budget = res.data[j].Budget;
              let Expense = res.data[j].Expense;
              let vertical = res.data[j].vertical;
              let meeting_gift = res.data[j].meeting_gift;
<<<<<<< HEAD
              let pay_advance = res.data[j].pay_advance;
              let action_status=res.data[j].action_status
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
  
  
              
  let meetTypeText;
  
  if (Meet_Type === 1) {
    meetTypeText = 'In-Shop Meet';
  } else if (Meet_Type === 2) {
    meetTypeText = 'Contractor Meet';
  } else if(Meet_Type === 3){
    meetTypeText = 'Dealer Meet';
  }else{
    meetTypeText = 'SGA Meet';
  
  }
  
  
              if (!headerAppended) {
                $('#thead').html(`<tr>
                <th class='stickyhead1'>ID</th>
                <th>Action</th>
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
                <th>Dealer Code</th>
                <th>Dealer Name</th>
                <th>Venue</th>
                <th>City</th>
                <th>Agenda</th>
                <th>People Attended</th>
                <th>Outcome</th>
                <th>ADE</th>
                <th>Attended Jacpl</th>
                <th>Budget(Rs.)</th>
<<<<<<< HEAD
                 <th>Advance(Rs.)</th>
                <th>Expense (Rs.)</th>
                <th>Vertical</th>
                <th>Meeting Gift</th>
                <th>Expense Budget Exceed Status</th>

=======
                <th>Expense (Rs.)</th>
                <th>Vertical</th>
                <th>Meeting Gift</th>
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
              </tr>
              `);
                headerAppended = true;
              }
  
              
              $('#tbody').append(`<tr>
              <td class='stickybody1'><a class='' target="_blank" id='' href='/view_pending_btl_pdf/${emp_id}/${rc_id}/${meetTypeText}'>${rc_id}</a></td>
              <td><a href="/manage_pending_btl/${emp_id}/${rc_id}" class="f_14 text-danger action-btn"><i class="fa-solid fa-pen-to-square"></i></a></td>
              <td class='stickybody2'>${branch}</td>
              <td>${zone}</td>
              <td>${emp_id}</td>
              <td>${emp_name}</td>
<<<<<<< HEAD
              <td>${hqname}</td>
              <td>${hqcode}</td>
=======
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
              <td>${rep_manager_id}</td>
              <td>${rep_manager_name}</td>
              <td>${meetTypeText}</td>
              <td>${DateOfMeet}</td>
              <td>${Dealer_Code}</td>
              <td>${Dealer_Name}</td>
              <td>${Dealer_firm_Name}</td>
              <td>${City}</td>
              <td>${Agenda}</td>
              <td>${mobileCount}</td>
              <td>${Outcome}</td>
              <td>${Cond_By}</td>
              <td>${Jacpl_Attended}</td>
              <td>${Budget}</td>
<<<<<<< HEAD
                <td>${pay_advance}</td>
              <td>${Expense}</td>
              <td>${vertical}</td>
              <td>${meeting_gift}</td>
              <td>${action_status}</td>

=======
              <td>${Expense}</td>
              <td>${vertical}</td>
              <td>${meeting_gift}</td>
>>>>>>> ed83d7165492aeec5271d205ce0189f2a1084730
            </tr>
            `);
  
  
          }
  
  
  
        }
      
      
      }
        ,
        error: function (error) {
          console.error(error);
        }
      });
    });
  });


  $(document).ready(function() {
    function generateExcel(tableData) {
        let csvContent = "\uFEFF";

        let headers = tableData.find('thead th:not(.no-export)').map(function (index) { 
            if (index !== 1) { 
                let headerText = $(this).clone().children().remove().end().text();
                return headerText.replace(/[";]/g, "") || ' ';
            }
        }).get();
        csvContent += headers.join(",") + "\n";

        tableData.find('tbody tr').each(function () {
          let row = [];
          $(this).find('td:not(.no-export)').each(function (index) {
              if (index !== 1) {  
                  let cellText;
                  if ($(this).hasClass('8th')) {
                      cellText = $(this).text().trim();
                  } else {
                      cellText = $(this).text().replace(/"/g, '').replace(/[\r\n]+/g, ' ').trim();
                  }
                  row.push(cellText.includes(',') ? '"' + cellText + '"' : cellText);
              }
          });
          csvContent += row.join(",") + "\n";
      });
      
      

        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
        link.setAttribute("download", "view_pending_btl"  + ".csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    let initialTableData = $('#dataTables').clone();

    $(document).on('click', '#excel_btn', function () {
        let filteredTableData = $('#dataTables').clone(); 
        let isFiltered = !initialTableData.is(filteredTableData);

        if (isFiltered) {
            generateExcel(filteredTableData);
        } else {
            generateExcel(initialTableData);
        }
    });

    $('#evt_run').on('click', function() {
        initialTableData = $('#dataTables').clone(); 
    });
});





$(document).on('click','#export_pdf',function(){
  window.print()

})
























document.getElementById('tabDropdown').addEventListener('change', function() {
    var selectedTabId = this.value;
    var tabContent = document.getElementById(selectedTabId);
    if (tabContent) {
        var tabs = document.querySelectorAll('.nav-link');
        tabs.forEach(function(tab) {
            if (tab.getAttribute('data-bs-target') === '#' + selectedTabId) {
                tab.click();
            }
        });
    }
    this.disabled = true;
});



function charCount(textarea) {
    var max = 200;
    var length = textarea.value.length;
    var remaining = max - length;

    if (remaining < 0) {
        textarea.value = textarea.value.substring(0, max);
        $("#textcount").text('0').addClass('text-danger');
    } else {
        if (remaining < 20) {
            $("#textcount").addClass('text-danger');
        } else {
            $("#textcount").removeClass('text-danger');
        }
        $("#textcount").text(remaining);
    }
}
$(document).ready(function () {
    $("#myTextarea").on("keyup", function () {
        charCount(this);
    });
});




$(document).ready(function () {
    $(document).on('click', '#ap_submit', function () {
        let zone = $('#ap_zone').val();
        let company = $('#ap_company').val();
        let voucher = $('#ap_voucher').val();
        let rc_id = $('#rc_id').text();

        if(zone == '' || company == '' || voucher == '' ){
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Please Fill all the fields!",
          });
         }else{

        $.ajax({
            url: '/approval_btl',
            method: 'POST',
            data: ({ zone: zone, company: company, voucher: voucher, rc_id: rc_id }),
            success: function (res) {
                console.log(res,'res')
                if(res.success){
                      Swal.fire({
                        title: "Good job!",
                        text: "Approved",
                        icon: "success",
                    }).then(() => {
                        window.location.href = '/view_pending_btl';
                    });
                }
            }
           
        });
      }
    });
});



$(document).ready(function(){
    $(document).on('click','#rej_btn',function(){
        let remarks=$('#myTextarea').val()
        let rc_id = $('#rc_id').text();
        let emp_idd=$('#emp_idd').text()
        let emp_nameeee=$('#emp_nameeee').text()
        let meetTypeText=$('#meetTypeText').text()
        let people_attended=$('#people_attended').text()
       if(remarks == ''){
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Please Fill the remarks!",
        });
       }else{


        $.ajax({
            url: '/rejected_btl',
            method: 'POST',
            data: ({ remarks: remarks,rc_id:rc_id ,emp_idd:emp_idd,emp_nameeee:emp_nameeee,meetTypeText:meetTypeText,people_attended:people_attended}),
            success: function (res) {
              console.log(res,'res')
              if(res.success){
                Swal.fire({
                    title: "Good job!",
                    text: "Rejected",
                    icon: "success",
                }).then(() => {
                    window.location.href = '/view_pending_btl';
                });
                
            }
            }
                    });
       }

    })
})


$('.img_inlarge').on('click', function() {
  var imgSrc = $(this).attr('src'); 
  $('#enlargedImage').attr('src', imgSrc); 
  $('#exampleModal').modal('show'); 
});




$(document).on('click','#back',function(){
  window.history.back()
})
