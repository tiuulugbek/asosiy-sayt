import { useLocation } from 'react-router-dom';
import PostForm from '../posts/PostForm';

export default function SectionPostForm() {
  const location = useLocation();
  const section = location.pathname.includes('children-hearing') ? 'children' : 'patients';
  const basePath = section === 'children' ? '/children-hearing' : '/patients';
  return <PostForm backPath={basePath} categorySection={section} />;
}
