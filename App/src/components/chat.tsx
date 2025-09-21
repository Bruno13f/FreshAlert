"use client"

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/ui/chat-container"
import { Markdown } from "@/components/ui/markdown"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"
import { Prompt } from "./prompt"
import Header from "./header"
import { postMessage } from "../services/api"

export function Chat() {
  const [messages, setMessages] = useState<{ id: number; role: string; content: string }[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamContentRef = useRef("")

  const addMessage = async (content: string) => {
    const newMessage = {
      id: messages.length + 1,
      role: "user",
      content: content
    }
    setMessages((prev) => [...prev, newMessage])

    // Show typing indicator
    setIsTyping(true)

    // Call API and stream response
    try {
      const response = await postMessage(content)
      if (response) {
        // Hide typing indicator and start streaming
        setIsTyping(false)
        streamResponse(response)
      }else{
        streamResponse("Sorry, I didn't receive a response. Please try again.")
      }
    } catch (error) {
      console.error("Error calling API:", error)
      // Hide typing indicator and add error message
      setIsTyping(false)
      const errorMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request."
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const resetMessages = () => {
    setMessages([])
  }

  const streamResponse = (fullResponse: string) => {
    if (isStreaming) return

    setIsStreaming(true)

    const newMessageId = Date.now() // Use timestamp for unique ID
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
    }, 10)
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
      <Header onReset={resetMessages} />
      <div className="flex h-full w-full flex-col">
        <div className="flex h-[74vh] w-full flex-col overflow-hidden mt-12">
          {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full relative">
            <span className="text-base font-medium text-zinc-400">Hi geekathon!</span>
            <span className="text-xl font-semibold text-zinc-800">What can I help you with?</span>
            <div className="absolute bottom-2 left-0 right-0 flex gap-x-2 px-4 overflow-x-auto scrollbar-hide h-fit items-center" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {['Show production statistics', 'Spoilage rate per line', 'Efficiency overview', 'Any bottlenecks?'].map((text, index) => (
                <Button
                  key={index}
                  variant="outline" 
                  className={`shadow-none rounded-2xl max-w-[250px] px-2 text-center break-words whitespace-normal h-fit ${text.length > 20 ? 'line-clamp-2' : ''}`}
                  onClick={() => addMessage(text)}
                  disabled={isStreaming || isTyping}
                >
                  {text}
                </Button>
              ))}
            </div>
          </div>
          ) : (
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
              
              {/* Typing Indicator */}
              {isTyping && (
                <Message className="justify-start">
                  <MessageAvatar
                    src="/avatars/ai.png"
                    alt="AI Assistant"
                    fallback="AI"
                  />
                  <div className="w-auto max-w-[75%]">
                    <div className="bg-secondary text-foreground rounded-lg p-3 flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    </div>
                  </div>
                </Message>
              )}
            </ChatContainerContent>
          </ChatContainerRoot>)}
        </div>
        <div className="flex w-full items-center justify-center pt-2">
          <Prompt onSendMessage={addMessage} isDisabled={isStreaming || isTyping} />
        </div>
      </div>
    </>
  )
}
