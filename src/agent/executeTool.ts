import {tools} from "./tools/index"

export type ToolName = keyof typeof tools;

export async function executeTool(
    name: string,
    args: Record<string, unknown>,
):Promise<string> {
    const tool = tools[name as ToolName]

    if(!tool){
        return ` unknown tool ${name}`
    }

    const execute = tool.execute;
    if(!execute){
        return `Provider tool ${name} - executed by model provider`
    }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await execute(args as any,{
        toolCallId:"",
        messages:[],
    });

    return String(result);
}