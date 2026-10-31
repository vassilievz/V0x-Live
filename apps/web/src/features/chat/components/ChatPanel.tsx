import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MessageSquare, Send } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Button, Input } from "@v0xlive/ui";
import type { ChatMessage, RealtimeEvent } from "@v0xlive/api-client";
import { roomsApi } from "@/lib/api";
import { RoomMusicPlayer } from "@/features/room-music/components/RoomMusicPlayer";
import { cn } from "@/lib/cn";
import {
  roomChatAuthor,
  roomChatBody,
  roomChatComposer,
  roomChatMessage,
  roomChatMessages,
  roomChatSystem,
  roomChatSystemBadge,
  roomChatSystemBody,
  roomPanel,
  roomPanelEmbedded,
  roomPanelHeading,
} from "@/ui";

type Props = {
  roomId: string;
  lastEvent: RealtimeEvent | null;
  viewerRole?: string | null;
  embedded?: boolean;
};

function isSystemMessage(msg: ChatMessage): boolean {
  return msg.kind === "system";
}

export function ChatPanel({ roomId, lastEvent, viewerRole, embedded }: Props) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLLIElement>(null);
  const reduced = useReducedMotion();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const history = useQuery({
    queryKey: ["chat", roomId],
    queryFn: () => roomsApi.messages(roomId),
  });

  useEffect(() => {
    if (lastEvent?.type === "chat.message.created") {
      queryClient.invalidateQueries({ queryKey: ["chat", roomId] });
    }
  }, [lastEvent, queryClient, roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  }, [history.data?.items, reduced]);

  const send = useMutation({
    mutationFn: () => roomsApi.sendMessage(roomId, text.trim()),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["chat", roomId] });
    },
  });

  const items = history.data?.items ?? [];

  return (
    <div className={cn(roomPanel, embedded && roomPanelEmbedded)}>
      {!embedded ? (
        <p className={roomPanelHeading}>{t("chat.title")}</p>
      ) : null}
      <ul className={roomChatMessages} aria-label={t("chat.messagesAria")}>
        {history.isSuccess && items.length === 0 && (
          <li className="py-10 text-center">
            <MessageSquare className="mx-auto mb-3 size-6 text-muted" aria-hidden="true" />
            <p className="text-sm text-muted">{t("chat.empty")}</p>
          </li>
        )}
        {[...items].reverse().map((msg: ChatMessage) =>
          isSystemMessage(msg) ? (
            <li key={msg.id} className={roomChatSystem}>
              <span className={roomChatSystemBadge}>V0x Live</span>
              <p className={roomChatSystemBody}>{msg.body}</p>
            </li>
          ) : (
            <li key={msg.id} className={roomChatMessage}>
              <span className={roomChatAuthor}>{msg.sender_display_name}</span>
              <p className={roomChatBody}>{msg.body}</p>
            </li>
          ),
        )}
        <li ref={bottomRef} aria-hidden="true" className="h-px list-none" />
      </ul>

      <RoomMusicPlayer viewerRole={viewerRole} />

      <form
        className={roomChatComposer}
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim() && !send.isPending) send.mutate();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("chat.placeholder")}
          maxLength={2000}
          aria-label={t("chat.messageLabel")}
        />
        <Button
          type="submit"
          size="md"
          aria-label={t("chat.send")}
          disabled={!text.trim() || send.isPending}
        >
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
