import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-request-leave-form',
  templateUrl: './request-leave-form.component.html',
  styleUrls: ['./request-leave-form.component.css']
})
export class RequestLeaveFormComponent {
    leaveForm: FormGroup;
    isSaving = false;
    private apiUrl = 'https://localhost:44311/api/services/app/Leave';
    private employeeApiUrl = 'https://localhost:44311/api/services/app/Employee';
    reload: any;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        public bsModalRef: BsModalRef
    ) {
        this.leaveForm = this.fb.group({
            id: [0],
            leaveType: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            halfDay: [false]
        });
    }

    ngOnInit(): void {
    }

    //private loadEmployeeId() {
    //    this.http.get<any>(`${this.employeeApiUrl}/GetCurrentEmployee`).subscribe({
    //        next: (res) => {
    //            this.employeeId = res.id;
    //        },
    //        error: (err) => {
    //            console.error("Failed to load employee id:", err);
    //            abp.message.error("Could not fetch employee profile");
    //        }
    //    });
    //}

    submit() {
        if (this.leaveForm.invalid) {
            abp.message.warn("⚠ Please fill required fields");
            return;
        }

        const dto = {
            leaveType: this.leaveForm.value.leaveType,
            startDate: this.leaveForm.value.startDate,
            endDate: this.leaveForm.value.endDate,
            halfDay: this.leaveForm.value.halfDay
        };

        this.isSaving = true;
        this.http.post(`${this.apiUrl}/CreateLeave`, dto).subscribe({
            next: () => {
                abp.notify.success("Leave request submitted");
                this.bsModalRef.hide();
                if (this.reload) this.reload();
            },
            error: (err) => {
                console.error('Error creating leave:', err);
                abp.message.error("Failed to submit leave request");
            },
            complete: () => {
                this.isSaving = false;
            }
        });
    }

}

