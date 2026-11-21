import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { openChatRoomWith } from "../../lib/chatApi";

type ChatStartButtonProps = {
  userId: string;
};

export default function ChatStartButton({ userId }: ChatStartButtonProps) {
  const navigate = useNavigate();
  const [isOpening, setIsOpening] = useState(false);
  const [openError, setOpenError] = useState("");

  const handleClick = async () => {
    setIsOpening(true);
    setOpenError("");
    try {
      const chatRoom = await openChatRoomWith(userId);
      navigate(`/chat_rooms/${chatRoom.id}`);
    } catch {
      setOpenError("チャットを開けませんでした");
      // 成功時は画面が切り替わるため、押せる状態に戻すのは失敗したときだけ
      setIsOpening(false);
    }
  };

  return (
    <div className="flex-shrink-0 text-end">
      <button
        type="button"
        className="btn btn-sm btn-outline-primary text-nowrap"
        onClick={handleClick}
        disabled={isOpening}
      >
        <i className="fa-regular fa-comment me-1" aria-hidden="true" />
        チャット
      </button>
      {openError && <p className="text-danger small mt-1 mb-0">{openError}</p>}
    </div>
  );
}
