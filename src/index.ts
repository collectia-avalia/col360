import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_KEY are required in .env");
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Define tools
const READ_TABLE_TOOL: Tool = {
  name: "supabase_read_table",
  description: "Read data from a Supabase table with optional filtering, sorting, and pagination.",
  inputSchema: {
    type: "object",
    properties: {
      table: {
        type: "string",
        description: "Name of the table to read from",
      },
      select: {
        type: "string",
        description: "Columns to select (e.g., '*' or 'id, name'). Defaults to '*'",
      },
      filter: {
        type: "object",
        description: "Filter condition (column, operator, value)",
        properties: {
          column: { type: "string" },
          operator: { 
            type: "string", 
            enum: ["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in"],
            description: "Operator: eq, neq, gt, gte, lt, lte, like, ilike, is, in"
          },
          value: { 
            type: ["string", "number", "boolean", "null"],
            description: "Value to filter by" 
          }
        },
        required: ["column", "operator", "value"]
      },
      order: {
        type: "object",
        description: "Ordering options",
        properties: {
          column: { type: "string" },
          ascending: { type: "boolean", default: true }
        },
        required: ["column"]
      },
      limit: {
        type: "number",
        description: "Number of rows to return (default: 10)",
        default: 10
      }
    },
    required: ["table"],
  },
};

const INSERT_ROW_TOOL: Tool = {
  name: "supabase_insert_row",
  description: "Insert a row into a Supabase table.",
  inputSchema: {
    type: "object",
    properties: {
      table: { type: "string", description: "Name of the table" },
      data: { type: "object", description: "JSON object representing the row data" }
    },
    required: ["table", "data"],
  },
};

const UPDATE_ROW_TOOL: Tool = {
  name: "supabase_update_row",
  description: "Update rows in a Supabase table based on a filter.",
  inputSchema: {
    type: "object",
    properties: {
      table: { type: "string", description: "Name of the table" },
      data: { type: "object", description: "Data to update" },
      filter_column: { type: "string", description: "Column to filter by (e.g., 'id')" },
      filter_value: { type: ["string", "number", "boolean"], description: "Value to match" }
    },
    required: ["table", "data", "filter_column", "filter_value"],
  },
};

const DELETE_ROW_TOOL: Tool = {
  name: "supabase_delete_row",
  description: "Delete rows from a Supabase table based on a filter.",
  inputSchema: {
    type: "object",
    properties: {
      table: { type: "string", description: "Name of the table" },
      filter_column: { type: "string", description: "Column to filter by (e.g., 'id')" },
      filter_value: { type: ["string", "number", "boolean"], description: "Value to match" }
    },
    required: ["table", "filter_column", "filter_value"],
  },
};

const RUN_RPC_TOOL: Tool = {
  name: "supabase_rpc",
  description: "Call a Postgres function (RPC) stored in Supabase.",
  inputSchema: {
    type: "object",
    properties: {
      function_name: { type: "string", description: "Name of the RPC function" },
      params: { type: "object", description: "Parameters for the function (optional)" }
    },
    required: ["function_name"],
  },
};

// Create MCP Server
const server = new Server(
  {
    name: "supabase-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List Tools Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      READ_TABLE_TOOL,
      INSERT_ROW_TOOL,
      UPDATE_ROW_TOOL,
      DELETE_ROW_TOOL,
      RUN_RPC_TOOL
    ],
  };
});

// Call Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "supabase_read_table") {
      const { table, select = "*", filter, order, limit = 10 } = args as any;
      let query = (supabase.from(table) as any).select(select);

      if (filter) {
        switch (filter.operator) {
          case 'eq': query = query.eq(filter.column, filter.value); break;
          case 'neq': query = query.neq(filter.column, filter.value); break;
          case 'gt': query = query.gt(filter.column, filter.value); break;
          case 'gte': query = query.gte(filter.column, filter.value); break;
          case 'lt': query = query.lt(filter.column, filter.value); break;
          case 'lte': query = query.lte(filter.column, filter.value); break;
          case 'like': query = query.like(filter.column, filter.value); break;
          case 'ilike': query = query.ilike(filter.column, filter.value); break;
          case 'is': query = query.is(filter.column, filter.value); break;
          case 'in': query = query.in(filter.column, Array.isArray(filter.value) ? filter.value : [filter.value]); break;
        }
      }

      if (order) {
        query = query.order(order.column, { ascending: order.ascending ?? true });
      }

      query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    if (name === "supabase_insert_row") {
      const { table, data } = args as any;
      const { data: inserted, error } = await (supabase.from(table) as any).insert(data).select();
      if (error) throw error;
      return {
        content: [{ type: "text", text: JSON.stringify(inserted, null, 2) }],
      };
    }

    if (name === "supabase_update_row") {
      const { table, data, filter_column, filter_value } = args as any;
      const { data: updated, error } = await (supabase.from(table) as any).update(data).eq(filter_column, filter_value).select();
      if (error) throw error;
      return {
        content: [{ type: "text", text: JSON.stringify(updated, null, 2) }],
      };
    }

    if (name === "supabase_delete_row") {
      const { table, filter_column, filter_value } = args as any;
      const { error } = await (supabase.from(table) as any).delete().eq(filter_column, filter_value);
      if (error) throw error;
      return {
        content: [{ type: "text", text: `Successfully deleted row(s) where ${filter_column} = ${filter_value}` }],
      };
    }

    if (name === "supabase_rpc") {
      const { function_name, params } = args as any;
      const { data, error } = await supabase.rpc(function_name, params);
      if (error) throw error;
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }

    throw new Error(`Tool not found: ${name}`);

  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Supabase MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
