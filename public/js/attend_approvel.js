


$(document).ready(function(){
    $(document).on('click','.Approval',function(){
        var rc_id = $(this).data('rc_id');
        var REP_MANAGER_NAME = $(this).data('rep_manager');
        window.location.href = `/sga_mail_approve/${rc_id}/${REP_MANAGER_NAME}`;
    });
});



$(document).ready(function(){
    $(document).on('click','.Reject',function(){
        var rc_id = $(this).data('rc_id');
        var REP_MANAGER_NAME = $(this).data('rep_manager');
        window.location.href = `/sga_mail_reject/${rc_id}/${REP_MANAGER_NAME}`;
    });
});






