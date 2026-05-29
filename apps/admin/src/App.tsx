import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardPage from './pages/dashboard/DashboardPage';
import AdminLayout from './components/AdminLayout';
import PostsPage from './pages/Posts';
import ServicesPage from './pages/Services';
import ServiceForm from './pages/services/ServiceForm';
import HomepagePage from './pages/Homepage';
import BannersPage from './pages/Banners';
import BannerForm from './pages/banners/BannerForm';
import CatalogPage from './pages/Catalog';
import CatalogForm from './pages/catalog/CatalogForm';
import ProductForm from './pages/catalog/ProductForm';
import DoctorsPage from './pages/Doctors';
import DoctorForm from './pages/doctors/DoctorForm';
import PatientsPage from './pages/Patients';
import ChildrenHearingPage from './pages/ChildrenHearing';
import AboutPage from './pages/About';
import BranchesPage from './pages/Branches';
import BranchForm from './pages/branches/BranchForm';
import BrandsPage from './pages/Brands';
import BrandForm from './pages/brands/BrandForm';
import MenusPage from './pages/Menus';
import FAQPage from './pages/FAQ';
import FAQForm from './pages/faq/FAQForm';
import PostForm from './pages/posts/PostForm';
import SectionPostForm from './pages/section/SectionPostForm';
import SettingsPage from './pages/Settings';
import MediaPage from './pages/Media';
import LeadsPage from './pages/Leads';
import ReviewsPage from './pages/Reviews';
import TrafficPage from './pages/Traffic';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="homepage" element={<HomepagePage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/new" element={<ServiceForm />} />
          <Route path="services/:id/edit" element={<ServiceForm />} />
          <Route path="sliders" element={<Navigate to="/banners" replace />} />
          <Route path="menu" element={<Navigate to="/menus" replace />} />
          <Route path="children" element={<Navigate to="/children-hearing" replace />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/new" element={<CatalogForm />} />
          <Route path="catalog/:id/edit" element={<CatalogForm />} />
          <Route path="catalog/:catId/products/new" element={<ProductForm />} />
          <Route path="catalog/:catId/products/:id/edit" element={<ProductForm />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="brands/new" element={<BrandForm />} />
          <Route path="brands/:id/edit" element={<BrandForm />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="doctors/new" element={<DoctorForm />} />
          <Route path="doctors/:id/edit" element={<DoctorForm />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/new" element={<SectionPostForm />} />
          <Route path="patients/:id/edit" element={<SectionPostForm />} />
          <Route path="children-hearing" element={<ChildrenHearingPage />} />
          <Route path="children-hearing/new" element={<SectionPostForm />} />
          <Route path="children-hearing/:id/edit" element={<SectionPostForm />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="branches/new" element={<BranchForm />} />
          <Route path="branches/:id/edit" element={<BranchForm />} />
          <Route path="posts" element={<PostsPage />} />
          <Route path="posts/new" element={<PostForm />} />
          <Route path="posts/:id/edit" element={<PostForm />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="banners/new" element={<BannerForm />} />
          <Route path="banners/:id/edit" element={<BannerForm />} />
          <Route path="menus" element={<MenusPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="faq/new" element={<FAQForm />} />
          <Route path="faq/:id/edit" element={<FAQForm />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="traffic" element={<TrafficPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
