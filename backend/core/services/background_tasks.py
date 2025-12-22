"""
Background task manager for handling async operations without Celery.
"""
import threading
import logging
from typing import Callable, Any, Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from concurrent.futures import ThreadPoolExecutor
import queue

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    PENDING = 'pending'
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'


@dataclass
class Task:
    """Represents a background task."""
    id: str
    name: str
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    result: Any = None


class BackgroundTaskManager:
    """
    Thread-based background task manager.
    
    A lightweight alternative to Celery for development and small deployments.
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        """Singleton pattern to ensure one task manager."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, max_workers: int = 4):
        if self._initialized:
            return
            
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self._tasks: Dict[str, Task] = {}
        self._task_counter = 0
        self._initialized = True
        logger.info(f"BackgroundTaskManager initialized with {max_workers} workers")
    
    def _generate_task_id(self) -> str:
        """Generate unique task ID."""
        with self._lock:
            self._task_counter += 1
            return f"task_{self._task_counter}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    def submit(
        self,
        func: Callable,
        *args,
        task_name: str = None,
        **kwargs
    ) -> str:
        """
        Submit a task for background execution.
        
        Args:
            func: Function to execute
            *args: Positional arguments for the function
            task_name: Optional name for the task
            **kwargs: Keyword arguments for the function
            
        Returns:
            str: Task ID
        """
        task_id = self._generate_task_id()
        task = Task(
            id=task_id,
            name=task_name or func.__name__,
        )
        self._tasks[task_id] = task
        
        def wrapper():
            task.status = TaskStatus.RUNNING
            task.started_at = datetime.now()
            
            try:
                result = func(*args, **kwargs)
                task.result = result
                task.status = TaskStatus.COMPLETED
                logger.info(f"Task {task_id} ({task.name}) completed successfully")
            except Exception as e:
                task.error = str(e)
                task.status = TaskStatus.FAILED
                logger.error(f"Task {task_id} ({task.name}) failed: {e}")
            finally:
                task.completed_at = datetime.now()
        
        self._executor.submit(wrapper)
        logger.info(f"Task {task_id} ({task.name}) submitted")
        
        return task_id
    
    def get_task_status(self, task_id: str) -> Optional[Task]:
        """Get task status by ID."""
        return self._tasks.get(task_id)
    
    def cleanup_old_tasks(self, max_age_hours: int = 24):
        """Remove completed tasks older than max_age_hours."""
        from datetime import timedelta
        
        cutoff = datetime.now() - timedelta(hours=max_age_hours)
        to_remove = []
        
        for task_id, task in self._tasks.items():
            if task.completed_at and task.completed_at < cutoff:
                to_remove.append(task_id)
        
        for task_id in to_remove:
            del self._tasks[task_id]
        
        if to_remove:
            logger.info(f"Cleaned up {len(to_remove)} old tasks")


# Global instance
task_manager = BackgroundTaskManager()


def run_in_background(func: Callable, *args, **kwargs) -> str:
    """
    Convenience function to run a task in background.
    
    Args:
        func: Function to execute
        *args: Arguments for the function
        **kwargs: Keyword arguments for the function
        
    Returns:
        str: Task ID
    """
    return task_manager.submit(func, *args, **kwargs)
