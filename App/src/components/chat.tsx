"use client"

import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container"
import { Markdown } from "@/components/ui/markdown"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"
import { ScrollButton } from "./ui/scroll-button"
import { Prompt } from "./prompt"
import Header from "./header"

export function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "user",
      content: "Hello! Can you help me with a coding question?",
    },
    {
      id: 2,
      role: "assistant",
      content:
        "Of course! I'd be happy to help with your coding question. What would you like to know?",
    },
    {
      id: 3,
      role: "user",
      content: "How do I create a responsive layout with CSS Grid?",
    },
    {
      id: 4,
      role: "assistant",
      content:
        "Creating a responsive layout with CSS Grid is straightforward. Here's a basic example:\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 1rem;\n}\n```\n\nThis creates a grid where:\n- Columns automatically fit as many as possible\n- Each column is at least 250px wide\n- Columns expand to fill available space\n- There's a 1rem gap between items\n\nWould you like me to explain more about how this works?",
    },
  ])

  const [isStreaming, setIsStreaming] = useState(false)
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamContentRef = useRef("")

  const streamResponse = () => {
    if (isStreaming) return

    setIsStreaming(true)
    const fullResponse =
      "Yes, I'd be happy to explain more about CSS Grid! The `grid-template-columns` property defines the columns in your grid. The `repeat()` function is a shorthand that repeats a pattern. `auto-fit` will fit as many columns as possible in the available space. The `minmax()` function sets a minimum and maximum size for each column. This creates a responsive layout that automatically adjusts based on the available space without requiring media queries."

    const newMessageId = messages.length + 1
    setMessages((prev) => [
      ...prev,
      {
        id: newMessageId,
        role: "assistant",
        content: "",
      },
    ])

    let charIndex = 0
    streamContentRef.current = ""

    streamIntervalRef.current = setInterval(() => {
      if (charIndex < fullResponse.length) {
        streamContentRef.current += fullResponse[charIndex]
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessageId
              ? { ...msg, content: streamContentRef.current }
              : msg
          )
        )
        charIndex++
      } else {
        clearInterval(streamIntervalRef.current!)
        setIsStreaming(false)
      }
    }, 30)
  }

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current)
      }
    }
  }, [])

  return (
    <>
      <Header />
      <div className="flex h-full w-full flex-col">
        <div className="flex h-[74vh] w-full flex-col overflow-hidden mt-12">
          {/* <div className="absolute top-0 border-b p-3">
            <div />
            <Button size="sm" onClick={streamResponse} disabled={isStreaming}>
            {isStreaming ? "Streaming..." : "Show Streaming"}
          </Button>
        </div> */}

        <ChatContainerRoot className="flex-1">
          <ChatContainerContent className="space-y-4 px-4 py-2">
            {messages.map((message) => {
              const isAssistant = message.role === "assistant"

              return (
                <Message
                  key={message.id}
                  className={
                    message.role === "user" ? "justify-end" : "justify-start"
                  }
                >
                  {isAssistant && (
                    <MessageAvatar
                      src="/avatars/ai.png"
                      alt="AI Assistant"
                      fallback="AI"
                    />
                  )}
                  <div className="w-auto max-w-[75%]">
                    {isAssistant ? (
                      <div className="bg-secondary text-foreground prose rounded-lg p-2">
                        <Markdown>{message.content}</Markdown>
                      </div>
                    ) : (
                      <MessageContent className="bg-[#2a9261] text-background">
                        {message.content}
                      </MessageContent>
                    )}
                  </div>
                </Message>
              )
            })}
          </ChatContainerContent>
        </ChatContainerRoot>
      </div>
      <div className="flex w-full items-center justify-center pt-3">
        <Prompt />
      </div>
    </div>
    </>
  )
}
