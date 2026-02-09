import { ProposalData } from '@/types/shareCalendar';
import ShareMonthCalendarGrid from './ShareMonthCalendarGrid';
import SharePublicationCard from './SharePublicationCard';

interface ShareMonthSectionProps {
  month: {
    month: string;
    year: number | null;
    posts: Array<{
      id: string;
      day_of_month: number | null;
      image: {
        source: 'none' | 'clipboard' | 'file';
        clipboard_data_url: string;
        file_url: string;
      };
      title: string;
      copy: string;
    }>;
  };
  proposal: ProposalData;
  onUpdateProposal: (postId: string, field: 'titleChange' | 'copyChange' | 'comment', value: string) => void;
  isSubmitted: boolean;
}

const ShareMonthSection = ({
  month,
  proposal,
  onUpdateProposal,
  isSubmitted
}: ShareMonthSectionProps) => {
  if (month.posts.length === 0) return null;

  const capitalizedMonth = month.month.charAt(0).toUpperCase() + month.month.slice(1);
  const year = month.year || new Date().getFullYear();
  const sortedPosts = [...month.posts].sort((a, b) => (a.day_of_month || 99) - (b.day_of_month || 99));

  return (
    <section className="mb-16">
      {/* Month header */}
      <div className="mb-8">
        <h2 className="text-3xl font-light text-foreground tracking-tight">
          {capitalizedMonth} <span className="text-muted-foreground">{year}</span>
        </h2>
        <p className="text-muted-foreground mt-1">
          {month.posts.length} {month.posts.length === 1 ? 'publicación programada' : 'publicaciones programadas'}
        </p>
        <div className="w-16 h-0.5 bg-primary/50 mt-4" />
      </div>

      {/* Calendar grid */}
      <ShareMonthCalendarGrid 
        month={month.month} 
        year={year} 
        posts={month.posts} 
      />

      {/* Publication cards */}
      <div className="space-y-6">
      {sortedPosts.map((post, index) => (
          <SharePublicationCard
            key={post.id}
            post={post}
            publicationNumber={index + 1}
            monthName={month.month}
            year={year}
            proposal={proposal}
            onUpdateProposal={onUpdateProposal}
            isSubmitted={isSubmitted}
          />
        ))}
      </div>
    </section>
  );
};

export default ShareMonthSection;
