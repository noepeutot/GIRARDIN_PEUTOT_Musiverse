import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { PostType } from "@/pages/home";
import { MusicPlayer } from "./musicPlayer";
import { RelativeTimeDisplay } from "./relativeTimeDisplay";
import { CommentsModal, BaseComment } from "./commentsModal";
import { useSocial, Comment, getPostLikes, getPostViews } from "@/lib/socialContext";
import { useFollow } from "@/lib/followContext";

interface PostProps {
  post: PostType;
  hideSubscribe?: boolean;
}

const printMinifiedNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    return num.toString();
  }
};

export const Post = ({ post, hideSubscribe = false }: PostProps) => {
  const { isPostLiked, toggleLike, getComments, addComment, isCommentLiked, toggleCommentLike } = useSocial();
  const { isFollowing, followUser, unfollowUser } = useFollow();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isClient, setIsClient] = useState(false);

  // ID utilisateur basé sur le post (artistId ou hash du username)
  const userId = useMemo(() => {
    if (post.artistId) return post.artistId;
    const hash = post.username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `user_${hash}`;
  }, [post.artistId, post.username]);

  const isUserFollowed = isFollowing(userId);

  // Générer un ID unique et stable pour le post basé sur son contenu (pas la date pour éviter les problèmes SSR)
  const postId = useMemo(() => {
    // Hash simple du contenu pour créer un ID stable
    const contentHash = post.content.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `post_${post.username}_${contentHash}`;
  }, [post.username, post.content]);

  // Charger les commentaires uniquement côté client après le montage
  useEffect(() => {
    setIsClient(true);
    setComments(getComments(postId));
  }, [postId, getComments]);

  const isLiked = isPostLiked(postId);
  
  // Utiliser les valeurs générées de manière déterministe
  const baseLikes = getPostLikes(postId);
  const displayedLikes = isLiked ? baseLikes + 1 : baseLikes;
  const displayedViews = getPostViews(postId);
  
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showViewsTooltip, setShowViewsTooltip] = useState(false);

  // Fermer le tooltip automatiquement après 2 secondes
  useEffect(() => {
    if (showViewsTooltip) {
      const timer = setTimeout(() => setShowViewsTooltip(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showViewsTooltip]);

  const handleLike = () => {
    setIsLikeAnimating(true);
    toggleLike(postId);
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const handleOpenComments = () => {
    setShowComments(true);
  };

  const handleFollow = () => {
    if (isUserFollowed) {
      unfollowUser(userId);
    } else {
      followUser({
        id: userId,
        name: post.username,
        image: post.artistImage,
        isArtist: !!post.artistId,
      });
    }
  };

  return (
    <>
      <article className="border-1 border-gray-300 rounded-[10px] p-4">
        {/* Top bar of a post */}
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {post.artistId ? (
              <Link href={`/profile/${post.artistId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image
                  src={post.artistImage || "/photoProfil.png"}
                  alt="Profile Photo"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
                <span className="font-bold text-[0.95em] hover:underline">
                  {post.username}
                </span>
              </Link>
            ) : (
              <>
                <Image
                  src={post.artistImage || "/photoProfil.png"}
                  alt="Profile Photo"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
                <span className="font-bold text-[0.95em]">
                  {post.username}
                </span>
              </>
            )}
            <span className="font-normal text-gray-500 text-[0.95em]">•</span>
            <span className="font-normal text-gray-500 text-[0.95em]">
              <RelativeTimeDisplay datePosted={post.datePosted}/>
            </span>
          </div>
          {!hideSubscribe && (
            <button 
              onClick={handleFollow}
              className={`cursor-pointer transition-all text-[0.8em] py-1 px-3 rounded-[5px] ${
                isUserFollowed 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-(--brown) text-(--text-color) hover:opacity-80'
              }`}
            >
              {isUserFollowed ? 'Abonné' : "S'abonner"}
            </button>
          )}
        </header>
        {/* Content */}
        <div>
          <p>{post.content}</p>
          {post.music && (
            <MusicPlayer className="mt-4" music={post.music}/>
          )}
        </div>
        <footer className="flex items-center justify-center gap-10 mt-4">
          {/* Commentaires - cliquable avec effet hover */}
          <button 
            onClick={handleOpenComments}
            className="flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <svg
              width="16"
              height="15"
              viewBox="0 0 16 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.52114 0C6.53623 0 5.56096 0.193993 4.65101 0.570904C3.74107 0.947814 2.91428 1.50026 2.21784 2.1967C0.811316 3.60322 0.0211398 5.51088 0.0211398 7.5C0.0145832 9.23185 0.614234 10.9114 1.71614 12.2475L0.21614 13.7475C0.112072 13.853 0.0415744 13.9869 0.0135438 14.1324C-0.0144868 14.2779 0.00120517 14.4284 0.0586397 14.565C0.120933 14.6999 0.221918 14.8133 0.348775 14.8908C0.475632 14.9682 0.62264 15.0063 0.77114 15H7.52114C9.51026 15 11.4179 14.2098 12.8244 12.8033C14.231 11.3968 15.0211 9.48912 15.0211 7.5C15.0211 5.51088 14.231 3.60322 12.8244 2.1967C11.4179 0.790176 9.51026 0 7.52114 0ZM7.52114 13.5H2.57864L3.27614 12.8025C3.41583 12.662 3.49423 12.4719 3.49423 12.2738C3.49423 12.0756 3.41583 11.8855 3.27614 11.745C2.29408 10.764 1.68252 9.4729 1.54566 8.09159C1.4088 6.71029 1.7551 5.32425 2.52556 4.16964C3.29602 3.01503 4.44298 2.16327 5.77103 1.75948C7.09907 1.35569 8.52603 1.42485 9.8088 1.95519C11.0916 2.48552 12.1508 3.44421 12.806 4.66792C13.4612 5.89163 13.6718 7.30466 13.402 8.66625C13.1322 10.0279 12.3986 11.2538 11.3263 12.1352C10.254 13.0166 8.90921 13.4989 7.52114 13.5Z"
                fill="#7B7B7B"
              />
            </svg>
            <span className="text-[0.85em] text-gray-600">
              {isClient ? printMinifiedNumber(comments.length) : '...'}
            </span>
          </button>

          {/* Like - avec animation */}
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 cursor-pointer transition-all duration-200 ${
              isLikeAnimating ? 'scale-125' : 'scale-100'
            } hover:scale-110 active:scale-95`}
          >
            <Heart 
              size={16} 
              className={`transition-colors duration-200 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
              fill={isLiked ? 'currentColor' : 'none'}
            />
            <span className={`text-[0.85em] transition-colors duration-200 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}>
              {printMinifiedNumber(displayedLikes)}
            </span>
          </button>

          {/* Vues - avec tooltip */}
          <div 
            className="relative flex items-center gap-1.5 cursor-pointer"
            onMouseEnter={() => setShowViewsTooltip(true)}
            onMouseLeave={() => setShowViewsTooltip(false)}
            onClick={() => setShowViewsTooltip(!showViewsTooltip)}
          >
            {/* Tooltip */}
            {showViewsTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap shadow-lg z-10">
                Nombre de vues
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            )}
            <svg
              width="15"
              height="12"
              viewBox="0 0 15 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.9426 5.7C13.4276 2.1825 10.5776 0 7.50261 0C4.42761 0 1.57761 2.1825 0.0626136 5.7C0.0213161 5.79462 0 5.89676 0 6C0 6.10324 0.0213161 6.20538 0.0626136 6.3C1.57761 9.8175 4.42761 12 7.50261 12C10.5776 12 13.4276 9.8175 14.9426 6.3C14.9839 6.20538 15.0052 6.10324 15.0052 6C15.0052 5.89676 14.9839 5.79462 14.9426 5.7ZM7.50261 10.5C5.12511 10.5 2.87511 8.7825 1.57761 6C2.87511 3.2175 5.12511 1.5 7.50261 1.5C9.88011 1.5 12.1301 3.2175 13.4276 6C12.1301 8.7825 9.88011 10.5 7.50261 10.5ZM7.50261 3C6.90927 3 6.32925 3.17595 5.8359 3.50559C5.34256 3.83524 4.95804 4.30377 4.73097 4.85195C4.50391 5.40013 4.4445 6.00333 4.56026 6.58527C4.67601 7.16721 4.96174 7.70176 5.38129 8.12132C5.80085 8.54088 6.3354 8.8266 6.91734 8.94236C7.49929 9.05811 8.10249 8.9987 8.65066 8.77164C9.19884 8.54458 9.66738 8.16006 9.99702 7.66671C10.3267 7.17336 10.5026 6.59334 10.5026 6C10.5026 5.20435 10.1865 4.44129 9.62393 3.87868C9.06133 3.31607 8.29826 3 7.50261 3ZM7.50261 7.5C7.20594 7.5 6.91593 7.41203 6.66926 7.2472C6.42258 7.08238 6.23033 6.84811 6.11679 6.57403C6.00326 6.29994 5.97356 5.99834 6.03144 5.70736C6.08931 5.41639 6.23217 5.14912 6.44195 4.93934C6.65173 4.72956 6.91901 4.5867 7.20998 4.52882C7.50095 4.47094 7.80255 4.50065 8.07664 4.61418C8.35073 4.72771 8.585 4.91997 8.74982 5.16665C8.91464 5.41332 9.00261 5.70333 9.00261 6C9.00261 6.39782 8.84458 6.77936 8.56327 7.06066C8.28197 7.34196 7.90044 7.5 7.50261 7.5Z"
                fill="#7B7B7B"
              />
            </svg>
            <span className="text-[0.85em] text-gray-600">
              {printMinifiedNumber(displayedViews)}
            </span>
          </div>
        </footer>
      </article>

      {/* Modal commentaires */}
      <CommentsModal 
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        comments={comments.map(c => ({
          id: c.id,
          username: c.username,
          userImage: c.userImage,
          content: c.content,
          createdAt: c.createdAt,
          likes: c.likes,
        }))}
        onAddComment={(content, username, userImage) => addComment(postId, content, username, userImage)}
        onLikeComment={toggleCommentLike}
        isCommentLiked={isCommentLiked}
        formatLikes={printMinifiedNumber}
        variant="light"
      />
    </>
  );
};

