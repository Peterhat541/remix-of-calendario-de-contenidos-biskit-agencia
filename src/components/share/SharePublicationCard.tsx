import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProposalData, getPostProposal } from '@/types/shareCalendar';
import { MessageSquare, ChevronDown, ChevronUp, ZoomIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SharePublicationCardProps {
  post: {
    id: string;
    day_of_month: number | null;
    image: {
      source: 'none' | 'clipboard' | 'file';
      clipboard_data_url: string;
      file_url: string;
    };
    title: string;
    copy: string;
  };
  publicationNumber: number;
  monthName: string;
  year: number;
  proposal: ProposalData;
  onUpdateProposal: (postId: string, field: 'titleChange' | 'copyChange' | 'comment', value: string) => void;
  isSubmitted: boolean;
}

const SharePublicationCard = ({
  post,
  publicationNumber,
  monthName,
  year,
  proposal,
  onUpdateProposal,
  isSubmitted
}: SharePublicationCardProps) => {
  const [showProposalSection, setShowProposalSection] = useState(false);

  const postProposal = getPostProposal(proposal, post.id);
  const imageUrl = post.image.source === 'clipboard' 
    ? post.image.clipboard_data_url 
    : post.image.source === 'file' 
    ? post.image.file_url 
    : '';

  const hasProposals = postProposal.titleChange || postProposal.copyChange || 
    postProposal.comment;

  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <article className="bg-white rounded-lg border border-border/50 shadow-sm overflow-hidden">
      {/* Publication header */}
      <div className="flex items-center justify-between px-6 py-3 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Publicación {publicationNumber}
          </span>
          {post.day_of_month && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-sm font-medium text-foreground">
                {post.day_of_month} de {capitalizedMonth} {year}
              </span>
            </>
          )}
        </div>
        {hasProposals && (
          <span className="text-xs px-2 py-1 bg-primary/10 text-foreground rounded-full font-medium">
            Con propuestas
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="p-6">
        <div className="grid md:grid-cols-[320px_1fr] gap-8">
          {/* Image - larger and clickable */}
          <div>
            {imageUrl ? (
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative group cursor-pointer">
                    <div className="aspect-[4/5] rounded-lg overflow-hidden bg-muted border border-border/30">
                      <img 
                        src={imageUrl} 
                        alt={post.title || 'Imagen de publicación'} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
                        <ZoomIn className="h-5 w-5 text-foreground" />
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-2 bg-white">
                  <img 
                    src={imageUrl} 
                    alt={post.title || 'Imagen de publicación'} 
                    className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                  />
                </DialogContent>
              </Dialog>
            ) : (
              <div className="aspect-[4/5] rounded-lg bg-muted/50 border border-dashed border-border flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Título
              </h4>
              <p className="text-xl font-medium text-foreground leading-tight">
                {post.title || <span className="text-muted-foreground italic font-normal">Sin título definido</span>}
              </p>
            </div>

            {/* Copy */}
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Copy
              </h4>
              <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap bg-muted/20 rounded-lg p-4 border-l-2 border-primary/30">
                {post.copy || <span className="text-muted-foreground italic">Sin copy definido</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Section */}
      <div className="border-t border-border/50">
        <button
          onClick={() => setShowProposalSection(!showProposalSection)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Propuesta del cliente
            </span>
            {hasProposals && (
              <span className="text-xs text-muted-foreground">
                ({(postProposal.comment ? 1 : 0) + (postProposal.titleChange ? 1 : 0) + (postProposal.copyChange ? 1 : 0)} cambios)
              </span>
            )}
          </div>
          {showProposalSection ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showProposalSection && (
          <div className="px-6 pb-6 space-y-6 bg-muted/10">
            {/* Title proposal */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Proponer nuevo título
              </label>
              <Input
                placeholder="Escriba aquí su propuesta de título..."
                value={postProposal.titleChange || ''}
                onChange={(e) => onUpdateProposal(post.id, 'titleChange', e.target.value)}
                disabled={isSubmitted}
                className="bg-white"
              />
            </div>

            {/* Copy proposal */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Proponer nuevo copy
              </label>
              <Textarea
                placeholder="Escriba aquí su propuesta de copy..."
                value={postProposal.copyChange || ''}
                onChange={(e) => onUpdateProposal(post.id, 'copyChange', e.target.value)}
                disabled={isSubmitted}
                className="min-h-[100px] bg-white"
              />
            </div>

            {/* Comment */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Comentario
                </span>
              </div>
              
              <Textarea
                placeholder="Escriba aquí su comentario..."
                value={postProposal.comment || ''}
                onChange={(e) => onUpdateProposal(post.id, 'comment', e.target.value)}
                disabled={isSubmitted}
                className="min-h-[80px] bg-white"
              />
            </div>

          </div>
        )}
      </div>
    </article>
  );
};

export default SharePublicationCard;
