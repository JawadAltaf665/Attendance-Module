import {Component, Injector, OnInit} from '@angular/core';
import {AppComponentBase} from '@shared/app-component-base';
import {
    Router,
    RouterEvent,
    NavigationEnd,
    PRIMARY_OUTLET
} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {MenuItem} from '@shared/layout/menu-item';

@Component({
    selector: 'sidebar-menu',
    templateUrl: './sidebar-menu.component.html'
})
export class SidebarMenuComponent extends AppComponentBase implements OnInit {
    menuItems: MenuItem[];
    menuItemsMap: { [key: number]: MenuItem } = {};
    activatedMenuItems: MenuItem[] = [];
    routerEvents: BehaviorSubject<RouterEvent> = new BehaviorSubject(undefined);
    homeRoute = '/app/about';

    constructor(injector: Injector, private router: Router) {
        super(injector);
        this.router.events.subscribe(this.routerEvents);
    }

    ngOnInit(): void {
        this.menuItems = this.getMenuItems();
        this.patchMenuItems(this.menuItems);
        this.routerEvents
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe((event) => {
                const currentUrl = event.url !== '/' ? event.url : this.homeRoute;
                const primaryUrlSegmentGroup = this.router.parseUrl(currentUrl).root
                    .children[PRIMARY_OUTLET];
                if (primaryUrlSegmentGroup) {
                    this.activateMenuItems('/' + primaryUrlSegmentGroup.toString());
                }
            });
    }

    getMenuItems(): MenuItem[] {
        return [
            new MenuItem(this.l('About'), '/app/about', 'fas fa-info-circle'),
            new MenuItem(this.l('HomePage'), '/app/home', 'fas fa-home'),
            new MenuItem(
                this.l('Attendance'),
                '',
                'fas fa-clock',
                'Pages.Attendance',
                [
                    new MenuItem(
                        this.l('Clock In/Out'),
                        '/app/attendance/clock-in-out',
                        'fas fa-user-clock',
                        'Pages.Attendance.ClockInOut'
                    ),
                    new MenuItem(
                        this.l('My History'),
                        '/app/attendance/history',
                        'fas fa-history',
                        'Pages.Attendance.View'
                    ),
                    new MenuItem(
                        this.l('Leave Request'),
                        '/app/attendance/leave-request',
                        'fas fa-calendar-plus',
                        'Pages.Leaves.Request'
                    ),
                    new MenuItem(
                        this.l('My Leaves'),
                        '/app/attendance/leave-list',
                        'fas fa-calendar-check',
                        'Pages.Leaves.View'
                    ),
                    new MenuItem(
                        this.l('Manager Approvals'),
                        '/app/attendance/approvals',
                        'fas fa-tasks',
                        'Pages.Leaves.Approve'
                    ),
                    new MenuItem(
                        this.l('Roster'),
                        '/app/attendance/roster',
                        'fas fa-calendar-alt',
                        'Pages.Rosters.View'
                    ),
                    new MenuItem(
                        this.l('Swap Approvals'),
                        '/app/attendance/swap-approvals',
                        'fas fa-exchange-alt',
                        'Pages.Rosters.Swap'
                    ),
                    new MenuItem(
                        this.l('Shift Management'),
                        '/app/attendance/admin/shifts',
                        'fas fa-business-time',
                        'Pages.Shifts.View'
                    )
                ]
            ),
            new MenuItem(
                this.l('Roles'),
                '/app/roles',
                'fas fa-theater-masks',
                'Pages.Roles'
            ),
            new MenuItem(
                this.l('Tenants'),
                '/app/tenants',
                'fas fa-building',
                'Pages.Tenants'
            ),
            new MenuItem(
                this.l('Users'),
                '/app/users',
                'fas fa-users',
                'Pages.Users'
            ),
            new MenuItem(this.l('MultiLevelMenu'), '', 'fas fa-circle', '', [
                new MenuItem('ASP.NET Boilerplate', '', 'fas fa-dot-circle', '', [
                    new MenuItem(
                        'Home',
                        'https://aspnetboilerplate.com?ref=abptmpl',
                        'far fa-circle'
                    ),
                    new MenuItem(
                        'Templates',
                        'https://aspnetboilerplate.com/Templates?ref=abptmpl',
                        'far fa-circle'
                    ),
                    new MenuItem(
                        'Samples',
                        'https://aspnetboilerplate.com/Samples?ref=abptmpl',
                        'far fa-circle'
                    ),
                    new MenuItem(
                        'Documents',
                        'https://aspnetboilerplate.com/Pages/Documents?ref=abptmpl',
                        'far fa-circle'
                    ),
                ]),
                new MenuItem('ASP.NET Zero', '', 'fas fa-dot-circle', '', [
                    new MenuItem(
                        'Home',
                        'https://aspnetzero.com?ref=abptmpl',
                        'far fa-circle'
                    ),
                    new MenuItem(
                        'Features',
                        'https://aspnetzero.com/Features?ref=abptmpl',
                        'far fa-circle'
                    ),
                    new MenuItem(
                        'Pricing',
                        'https://aspnetzero.com/Pricing?ref=abptmpl#pricing',
                        'far fa-circle'
                    ),
                    new MenuItem(
                        'Faq',
                        'https://aspnetzero.com/Faq?ref=abptmpl',
                        'far fa-circle'
                    ),
                    new MenuItem(
                        'Documents',
                        'https://aspnetzero.com/Documents?ref=abptmpl',
                        'far fa-circle'
                    )
                ])
            ])
        ];
    }

    patchMenuItems(items: MenuItem[], parentId?: number): void {
        items.forEach((item: MenuItem, index: number) => {
            item.id = parentId ? Number(parentId + '' + (index + 1)) : index + 1;
            if (parentId) {
                item.parentId = parentId;
            }
            if (parentId || item.children) {
                this.menuItemsMap[item.id] = item;
            }
            if (item.children) {
                this.patchMenuItems(item.children, item.id);
            }
        });
    }

    activateMenuItems(url: string): void {
        this.deactivateMenuItems(this.menuItems);
        this.activatedMenuItems = [];
        const foundedItems = this.findMenuItemsByUrl(url, this.menuItems);
        foundedItems.forEach((item) => {
            this.activateMenuItem(item);
        });
    }

    deactivateMenuItems(items: MenuItem[]): void {
        items.forEach((item: MenuItem) => {
            item.isActive = false;
            item.isCollapsed = true;
            if (item.children) {
                this.deactivateMenuItems(item.children);
            }
        });
    }

    findMenuItemsByUrl(
        url: string,
        items: MenuItem[],
        foundedItems: MenuItem[] = []
    ): MenuItem[] {
        items.forEach((item: MenuItem) => {
            if (item.route === url) {
                foundedItems.push(item);
            } else if (item.children) {
                this.findMenuItemsByUrl(url, item.children, foundedItems);
            }
        });
        return foundedItems;
    }

    activateMenuItem(item: MenuItem): void {
        item.isActive = true;
        if (item.children) {
            item.isCollapsed = false;
        }
        this.activatedMenuItems.push(item);
        if (item.parentId) {
            this.activateMenuItem(this.menuItemsMap[item.parentId]);
        }
    }

    isMenuItemVisible(item: MenuItem): boolean {
        if (!item.permissionName) {
            return true;
        }
        return this.permission.isGranted(item.permissionName);
    }
}
