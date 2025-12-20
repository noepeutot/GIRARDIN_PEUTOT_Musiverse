import { useState, useEffect } from 'react'

const printDateDifference = (date: Date) => {
  const dateDiff = Date.now() - date.getTime();

  const seconds = Math.round(dateDiff / 1000);

  if (seconds < 60) return "à l'instant";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}j`;

  const months = Math.round(days / 30.4375);
  if (months < 12) return `${months}m`;

  const years = Math.round(months / 12);
  return `${years}a`;
};

interface RelativeTimeDisplayProps {
  datePosted: Date;
}

export const RelativeTimeDisplay = ({ datePosted }: RelativeTimeDisplayProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [relativeTime, setRelativeTime] = useState('');
  
  useEffect(() => {
    setIsMounted(true);
    setRelativeTime(printDateDifference(datePosted));

    const timer = setInterval(() => {
      setRelativeTime(printDateDifference(datePosted));
    }, 60000);

    return () => clearInterval(timer);
  }, [datePosted]);

  return (
    <>
      {isMounted ? (relativeTime) : (new Date(datePosted).toLocaleDateString())}
    </>
  )
}
