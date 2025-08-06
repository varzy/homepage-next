import Image from 'next/image';
import AvatarFront from '../../assets/avatar_front.png';
import AvatarBack from '../../assets/avatar_back.jpg';

export default function Avatar() {
  return (
    <div className="group relative size-[160px] overflow-hidden rounded-full">
      <Image className="absolute top-0 left-0 size-full object-cover" src={AvatarFront} alt="avatar front" />
      <Image
        className="absolute top-0 left-0 size-full object-cover opacity-0 transition-all duration-[400ms] ease-in-out group-hover:opacity-100"
        src={AvatarBack}
        alt="avatar back"
      />
    </div>
  );
}
