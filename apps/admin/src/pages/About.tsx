import PageHeader from '../components/common/PageHeader';
import PageEditor from '../components/PageEditor';

export default function AboutPage() {
  return (
    <div>
      <PageHeader title="Biz haqimizda" description="Kompaniya haqida sahifa kontenti" />
      <PageEditor slug="about" defaultTitleUz="Biz haqimizda" defaultTitleRu="О нас" />
    </div>
  );
}
