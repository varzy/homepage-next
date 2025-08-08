import Image from 'next/image';
import AvatarFront from '../../assets/avatar_front.png';
import AvatarBack from '../../assets/avatar_back.jpg';

export default function Avatar() {
  return (
    <div className="group relative size-[10rem] cursor-pointer overflow-hidden rounded-full">
      <Image
        className="user-select-none absolute top-0 left-0 size-full object-cover transition-opacity duration-300 ease-in-out group-hover:opacity-0 group-active:opacity-0"
        src={AvatarFront}
        alt="avatar front"
        draggable={false}
      />
      <Image
        className="user-select-none absolute top-0 left-0 size-full object-cover opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 group-active:opacity-100"
        src={AvatarBack}
        alt="avatar back"
        draggable={false}
      />
    </div>
  );
}
