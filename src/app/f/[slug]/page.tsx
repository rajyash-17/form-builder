import PublicCasePage from '../../c/[shareId]/page';

export default function SlugAliasPage({ params }: { params: { slug: string } }) {
  return <PublicCasePage params={{ shareId: params.slug }} />;
}
