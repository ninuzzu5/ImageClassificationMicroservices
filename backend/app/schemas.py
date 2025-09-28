from pydantic import BaseModel, Field
from typing import List, Optional


class User(BaseModel):
    sub: str
    username: Optional[str] = Field(default=None, alias="preferred_username")
    email: Optional[str] = None
    name: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    tenant: Optional[str] = None
    roles: List[str] = []


class AuthorizeRequest(BaseModel):
    role: str


class AuthorizeResponse(BaseModel):
    allowed: bool
    role: str
    roles: List[str]
    source: str
