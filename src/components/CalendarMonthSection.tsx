import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import CalendarPostEditor from './CalendarPostEditor';
import { CalendarMonth, CalendarPost, createEmptyPost } from '@/types/contentCalendar';

interface CalendarMonthSectionProps {
  monthData: CalendarMonth;
  onUpdateMonth: (updated: CalendarMonth) => void;
  highlightPostIds?: string[];
}

const CalendarMonthSection = ({ monthData, onUpdateMonth, highlightPostIds = [] }: CalendarMonthSectionProps) => {
  const handlePostsCountChange = (count: number) => {
    const currentPosts = [...monthData.posts];
    
    if (count > currentPosts.length) {
      // Add empty posts
      const toAdd = count - currentPosts.length;
      for (let i = 0; i < toAdd; i++) {
        currentPosts.push(createEmptyPost());
      }
    } else if (count < currentPosts.length) {
      // Remove posts from the end
      currentPosts.splice(count);
    }
    
    onUpdateMonth({
      ...monthData,
      posts_count: count,
      posts: currentPosts
    });
  };

  const handleUpdatePost = (updatedPost: CalendarPost) => {
    onUpdateMonth({
      ...monthData,
      posts: monthData.posts.map(p => p.id === updatedPost.id ? updatedPost : p)
    });
  };

  const handleDeletePost = (id: string) => {
    const newPosts = monthData.posts.filter(p => p.id !== id);
    onUpdateMonth({
      ...monthData,
      posts_count: newPosts.length,
      posts: newPosts
    });
  };

  const handleAddPost = () => {
    onUpdateMonth({
      ...monthData,
      posts_count: monthData.posts_count + 1,
      posts: [...monthData.posts, createEmptyPost()]
    });
  };

  const capitalizedMonth = monthData.month.charAt(0).toUpperCase() + monthData.month.slice(1);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {capitalizedMonth} {monthData.year}
          </CardTitle>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground">Posts:</Label>
            <Select
              value={monthData.posts_count.toString()}
              onValueChange={(v) => handlePostsCountChange(parseInt(v))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 21 }, (_, i) => i).map(n => (
                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {monthData.posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay posts para este mes</p>
            <p className="text-xs mt-1">Selecciona cuántos posts deseas o añade uno manualmente</p>
          </div>
        ) : (
          monthData.posts
            .sort((a, b) => (a.day_of_month || 99) - (b.day_of_month || 99))
            .map(post => (
              <div 
                key={post.id}
                className={highlightPostIds.includes(post.id) ? 'ring-2 ring-amber-400 rounded-lg' : ''}
              >
                <CalendarPostEditor
                  post={post}
                  monthName={monthData.month}
                  year={monthData.year || new Date().getFullYear()}
                  onUpdate={handleUpdatePost}
                  onDelete={handleDeletePost}
                />
              </div>
            ))
        )}
        
        <Button 
          variant="outline" 
          className="w-full mt-2" 
          onClick={handleAddPost}
        >
          <Plus className="h-4 w-4 mr-2" />
          Añadir post
        </Button>
      </CardContent>
    </Card>
  );
};

export default CalendarMonthSection;
