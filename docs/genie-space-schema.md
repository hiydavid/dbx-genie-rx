# Databricks Genie Space Configuration Schema

This document describes the JSON schema for Databricks Genie Space configuration files.

## Root Structure

| Field | Type | Required | Description |
| ------- | ------ | ---------- | ------------- |
| `version` | integer | Yes | Schema version number |
| `config` | object | Yes | Configuration settings including sample questions |
| `data_sources` | object | Yes | Data source definitions (tables) |
| `instructions` | object | Yes | Instructions for the Genie agent |
| `benchmarks` | object | No | Benchmark questions for evaluation |

## JSON Schema

```json
{
  "version": 1,
  "config": {
    "sample_questions": [
      {
        "id": "string (hex)",
        "question": ["string"]
      }
    ]
  },
  "data_sources": {
    "tables": [
      {
        "identifier": "catalog.schema.table",
        "description": ["string"],
        "column_configs": [
          {
            "column_name": "string",
            "description": ["string"],
            "enable_format_assistance": true,
            "exclude": false,
            "synonyms": ["string"],
            "enable_entity_matching": false
          }
        ]
      }
    ],
    "metric_views": [
      {
        "identifier": "catalog.schema.metric_view",
        "description": ["string"]
      }
    ]
  },
  "instructions": {
    "text_instructions": [
      {
        "id": "string (hex)",
        "content": ["string (markdown)"]
      }
    ],
    "example_question_sqls": [
      {
        "id": "string (hex)",
        "question": ["string"],
        "sql": ["string"],
        "parameters": [
          {
            "name": "string",
            "type_hint": "STRING | INTEGER | DATE | ...",
            "description": ["string"]
          }
        ],
        "usage_guidance": ["string"]
      }
    ],
    "sql_functions": [
      {
        "id": "string (hex)",
        "identifier": "catalog.schema.function"
      }
    ],
    "join_specs": [
      {
        "id": "string (hex)",
        "left": {
          "identifier": "catalog.schema.table",
          "alias": "string"
        },
        "right": {
          "identifier": "catalog.schema.table",
          "alias": "string"
        },
        "sql": ["join_condition --rt=RELATIONSHIP_TYPE--"],
        "comment": ["string"]
      }
    ],
    "sql_snippets": {
      "filters": [
        {
          "id": "string (hex)",
          "sql": ["string"],
          "display_name": "string",
          "instruction": ["string"],
          "synonyms": ["string"]
        }
      ],
      "expressions": [
        {
          "id": "string (hex)",
          "sql": ["string"],
          "display_name": "string",
          "synonyms": ["string"]
        }
      ],
      "measures": [
        {
          "id": "string (hex)",
          "sql": ["string"],
          "display_name": "string",
          "instruction": ["string"]
        }
      ]
    }
  },
  "benchmarks": {
    "questions": [
      {
        "id": "string (hex)",
        "question": ["string"],
        "answer": [
          {
            "format": "SQL",
            "content": ["string"]
          }
        ]
      }
    ]
  }
}
```
