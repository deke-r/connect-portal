$(document).ready(function () {
    $(document).on('click', '#page', function () {
        window.location.href = '/'
    })
})


$(document).ready(function () {
    $(document).on('click', '#fg_pass', function () {
        let empid = $('#empid').val()

        if (empid == '') {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Please fill the employee id!",
            });
        } else {
            $.ajax({
                url: '/forgot_pass',
                method: 'POST',
                data: ({ empid: empid }),
                success: function (res) {
                    console.log(res)

                    if (res == 'ERROR') {
                        Swal.fire({
                            icon: "error",
                            title: "Oops...",
                            text: "Something went wrong!",
                        });
                    } else {
                        Swal.fire({
                            title: "Good job!",
                            text: "Your Password has been successfully reset.An SMS with your current password has been  sent to your registered mobile number.Please check your messages",
                            icon: "success"
                        })
                            .then(() => {
                                window.location.href = "/";

                            });
                    }




                }
            })

        }

    })
})