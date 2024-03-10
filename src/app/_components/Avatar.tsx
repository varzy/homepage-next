import Image from 'next/image';
import AvatarFront from '../../assets/avatar_front.png';
import AvatarBack from '../../assets/avatar_back.jpg';
import cls from 'classnames';

export default function Avatar() {
  return (
    <div className="group relative size-[160px] overflow-hidden rounded-full border-2">
      <Image className="absolute left-0 top-0 size-full object-cover" src={AvatarFront} alt="avatar front" />
      <Image
        className={cls(
          'transition-all',
          'duration-[480ms]',
          'ease-in-out',
          'absolute',
          'left-0',
          'top-0',
          'size-full',
          'object-cover',
          'opacity-0',
          'group-hover:opacity-100',
        )}
        src={AvatarBack}
        alt="avatar back"
      />
    </div>
  );
}
