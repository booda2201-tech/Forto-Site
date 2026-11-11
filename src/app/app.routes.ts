import { Routes } from '@angular/router';

import { DEPARTMENTS } from './core/departments';
import { DepartmentPage } from './pages/department/department.page';
import { HomePage } from './pages/home/home.page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'فورتو | مركز متكامل لخدمة السيارات - الهرم، الجيزة' },
  // One route per department (not one parametrised route) so moving between departments
  // always builds the page from scratch: its scroll triggers and videos start clean.
  ...DEPARTMENTS.map((d) => ({
    path: d.slug,
    component: DepartmentPage,
    title: d.seoTitle,
    data: { slug: d.slug },
  })),
  { path: '**', redirectTo: '' },
];
