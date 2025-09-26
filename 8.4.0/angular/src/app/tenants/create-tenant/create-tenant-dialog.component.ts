import {
  Component,
  Injector,
  OnInit,
  Output,
  EventEmitter
} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from '@shared/app-component-base';
import {
  DtoCreateTenantDto,
  TenantServiceProxy
} from '@shared/service-proxies/service-proxies';

@Component({
  templateUrl: 'create-tenant-dialog.component.html'
})
export class CreateTenantDialogComponent extends AppComponentBase
  implements OnInit {
  saving = false;
  tenant: DtoCreateTenantDto = new DtoCreateTenantDto();

  @Output() onSave = new EventEmitter<any>();

  constructor(
    injector: Injector,
    public _tenantService: TenantServiceProxy,
    public bsModalRef: BsModalRef
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.tenant.isActive = true;
  }

  save(): void {
    this.saving = true;

    this._tenantService.create(this.tenant).subscribe(
      () => {
        this.notify.info(this.l('SavedSuccessfully'));
        this.bsModalRef.hide();
        this.onSave.emit();
      },
      () => {
        this.saving = false;
      }
    );
  }
}
